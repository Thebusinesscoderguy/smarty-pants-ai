// Runtime whole-app translation.
//
// Most of the app renders hardcoded English (only ~44/196 files use the i18n
// dictionary). To make EVERY part of the UI switch language, this engine walks
// the rendered DOM, translates visible text + key attributes into the selected
// language via the `translate-text` edge function (OpenAI), caches aggressively
// in localStorage, and re-applies on React re-renders / route changes via a
// MutationObserver. Switching back to English restores the originals.
//
// Notes:
// - English ('en') is the source of truth; selecting it restores originals.
// - Arabic RTL is handled separately in LanguageContext (dir=rtl).
// - Placeholders ({name}, %s, HTML) are preserved by the edge function.

import { supabase } from '@/integrations/supabase/client';

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'svg', 'SVG']);
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const BATCH = 40;
const DEBOUNCE_MS = 250;
// Source of truth is English, so only translate text that contains a Latin letter.
// This skips strings already rendered in Arabic by the static i18n dictionary
// (t()) — preventing wasted API calls and avoiding re-"translating" correct
// Arabic back through an English→Arabic pass (which garbles it / causes flips).
const hasLetter = /[A-Za-z]/;

type Cache = Map<string, string>; // source(trimmed) -> translated

class DomTranslator {
  private lang = 'en';
  private caches = new Map<string, Cache>();          // lang -> cache
  private originalText = new WeakMap<Text, string>();  // node -> original nodeValue
  private origPhrase = new WeakMap<Element, string>(); // heading -> original full text
  private origHTML = new WeakMap<Element, string>();    // heading -> original innerHTML
  private observer: MutationObserver | null = null;
  private applying = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private inFlight = false;
  private tick: ReturnType<typeof setInterval> | null = null;
  private activated = false; // true once we've translated away from English

  private cacheFor(lang: string): Cache {
    let c = this.caches.get(lang);
    if (!c) {
      c = new Map();
      try {
        const raw = localStorage.getItem(`domtrans:${lang}`);
        if (raw) for (const [k, v] of Object.entries(JSON.parse(raw))) c.set(k, v as string);
      } catch { /* ignore */ }
      this.caches.set(lang, c);
    }
    return c;
  }

  private persist(lang: string) {
    try {
      const c = this.caches.get(lang);
      if (c) localStorage.setItem(`domtrans:${lang}`, JSON.stringify(Object.fromEntries(c)));
    } catch { /* quota — ignore */ }
  }

  setLanguage(lang: string) {
    if (typeof document === 'undefined') return;
    this.lang = lang;
    if (this.tick) { clearInterval(this.tick); this.tick = null; }
    if (lang === 'en') {
      // English is the source. If we've translated the live DOM, a reload is the
      // only fully reliable way to restore originals (React may have swapped the
      // text nodes we tracked). On a fresh 'en' load we never translated, so skip.
      if (this.activated) { window.location.reload(); return; }
      this.ensureObserver();
      return;
    }
    this.activated = true;
    this.cacheFor(lang);
    this.ensureObserver();
    this.translateTree(document.body);
    // React re-renders revert our text back to English, and some batches may not
    // have completed. Re-run translateTree on a short interval: it re-applies
    // cached translations (defeating reverts) AND fetches any still-missing
    // strings (retrying dropped batches) until everything is translated.
    this.tick = setInterval(() => {
      if (this.lang !== 'en') this.translateTree(document.body);
    }, 1000);
  }

  private ensureObserver() {
    if (this.observer || typeof document === 'undefined') return;
    this.observer = new MutationObserver((mutations) => {
      if (this.applying || this.lang === 'en') return;
      const relevant = mutations.some(m => m.type === 'childList' ? m.addedNodes.length > 0 : true);
      if (!relevant) return;
      // Instantly re-apply cached translations so React re-renders that revert text
      // back to English are corrected within the same frame (no flicker). Then
      // debounce a full translateTree to fetch any genuinely new strings.
      this.applyFromCache(document.body, this.lang);
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.translateTree(document.body), DEBOUNCE_MS);
    });
    this.observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  private eligible(node: Text): boolean {
    const p = node.parentElement;
    if (!p) return false;
    if (SKIP_TAGS.has(p.tagName)) return false;
    if (p.closest('[data-no-translate]')) return false;
    // Headings are translated as whole phrases (see translateHeadings) because
    // they're often split into one <span> per word (animation), which makes
    // per-node translation produce garbage. Skip their descendant text nodes.
    if (p.closest('h1,h2,h3,h4')) return false;
    if ((p as HTMLElement).isContentEditable) return false;
    const raw = node.nodeValue || '';
    return hasLetter.test(raw);
  }

  private collectHeadings(root: Node): HTMLElement[] {
    const rootEl = root instanceof Element ? root : document.body;
    const out: HTMLElement[] = [];
    rootEl.querySelectorAll<HTMLElement>('h1,h2,h3,h4').forEach((h) => {
      if (h.closest('[data-no-translate]')) return;
      const full = (h.textContent || '').replace(/\s+/g, ' ').trim();
      if (full && hasLetter.test(full)) out.push(h);
    });
    return out;
  }

  // Split " Hello " -> {pre:' ', core:'Hello', post:' '} for cache stability.
  private split(raw: string) {
    const m = raw.match(/^(\s*)([\s\S]*?)(\s*)$/);
    return m ? { pre: m[1], core: m[2], post: m[3] } : { pre: '', core: raw, post: '' };
  }

  private collectNodes(root: Node): Text[] {
    const out: Text[] = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: (n) => this.eligible(n as Text) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT,
    });
    let n: Node | null;
    while ((n = walker.nextNode())) out.push(n as Text);
    return out;
  }

  private collectAttrEls(root: Node): { el: Element; attr: string; core: string }[] {
    const out: { el: Element; attr: string; core: string }[] = [];
    const rootEl = root instanceof Element ? root : document.body;
    const els = rootEl.querySelectorAll('[placeholder],[title],[aria-label],[alt]');
    els.forEach((el) => {
      if (el.closest('[data-no-translate]')) return;
      for (const attr of ATTRS) {
        const v = el.getAttribute(attr);
        if (v && hasLetter.test(v)) out.push({ el, attr, core: v.trim() });
      }
    });
    return out;
  }

  private restoreAll() {
    if (typeof document === 'undefined') return;
    this.applying = true;
    try {
      for (const node of this.collectNodes(document.body)) {
        const orig = this.originalText.get(node);
        if (orig != null && node.nodeValue !== orig) node.nodeValue = orig;
      }
      document.querySelectorAll<HTMLElement>('h1,h2,h3,h4').forEach((h) => {
        const html = this.origHTML.get(h);
        if (html != null && h.innerHTML !== html) h.innerHTML = html;
      });
      document.querySelectorAll<HTMLElement>('[data-otr]').forEach((el) => {
        for (const attr of ATTRS) {
          const key = `otr_${attr.replace('-', '')}`;
          const orig = el.dataset[key];
          if (orig != null) el.setAttribute(attr, orig);
        }
      });
    } finally {
      this.applying = false;
    }
  }

  private async translateTree(root: Node) {
    if (this.lang === 'en' || typeof document === 'undefined') return;
    const lang = this.lang;
    const cache = this.cacheFor(lang);
    const nodes = this.collectNodes(root);
    const attrEls = this.collectAttrEls(root);

    const pending = new Set<string>();

    // Apply cached + collect misses (text nodes)
    this.applying = true;
    try {
      for (const node of nodes) {
        const raw = node.nodeValue || '';
        let orig = this.originalText.get(node);
        if (orig == null) { orig = raw; this.originalText.set(node, raw); }
        const { core } = this.split(orig);
        if (!core) continue;
        const hit = cache.get(core);
        if (hit != null) {
          const { pre, post } = this.split(orig);
          const next = pre + hit + post;
          if (node.nodeValue !== next) node.nodeValue = next;
        } else {
          pending.add(core);
        }
      }
      // headings as whole phrases
      for (const h of this.collectHeadings(root)) {
        let orig = this.origPhrase.get(h);
        if (orig == null) {
          orig = (h.textContent || '').replace(/\s+/g, ' ').trim();
          this.origPhrase.set(h, orig);
          this.origHTML.set(h, h.innerHTML);
        }
        const hit = cache.get(orig);
        if (hit != null) { if ((h.textContent || '').replace(/\s+/g, ' ').trim() !== hit) h.textContent = hit; }
        else pending.add(orig);
      }
      // attributes
      for (const { el, attr, core } of attrEls) {
        const key = `otr_${attr.replace('-', '')}`;
        const he = el as HTMLElement;
        if (he.dataset[key] == null) he.dataset[key] = el.getAttribute(attr) || '';
        const src = (he.dataset[key] || '').trim();
        if (!src) continue;
        const hit = cache.get(src);
        if (hit != null) { if (el.getAttribute(attr) !== hit) el.setAttribute(attr, hit); }
        else pending.add(src);
      }
    } finally {
      this.applying = false;
    }

    if (pending.size === 0 || this.inFlight) return;

    // Fetch missing translations in PARALLEL batches (server caches them in
    // ui_translations, so this only pays OpenAI latency once per string ever).
    const list = Array.from(pending);
    const chunks: string[][] = [];
    for (let i = 0; i < list.length; i += BATCH) chunks.push(list.slice(i, i + BATCH));
    this.inFlight = true;
    try {
      await Promise.all(chunks.map(async (chunk) => {
        try {
          const { data, error } = await supabase.functions.invoke('translate-text', {
            body: { texts: chunk, targetLang: lang, sourceLang: 'en' },
          });
          if (error) return;
          const translations: string[] = data?.translations || [];
          chunk.forEach((src, idx) => {
            const tr = translations[idx];
            if (typeof tr === 'string' && tr.length) cache.set(src, tr);
          });
        } catch { /* retried on next interval tick */ }
      }));
      this.persist(lang);
    } finally {
      this.inFlight = false;
    }

    // Re-apply now that cache is populated (covers the just-fetched strings).
    if (this.lang === lang) this.applyFromCache(document.body, lang);
  }

  private applyFromCache(root: Node, lang: string) {
    const cache = this.cacheFor(lang);
    this.applying = true;
    try {
      for (const node of this.collectNodes(root)) {
        const orig = this.originalText.get(node) ?? node.nodeValue ?? '';
        const { pre, core, post } = this.split(orig);
        const hit = core && cache.get(core);
        if (hit) { const next = pre + hit + post; if (node.nodeValue !== next) node.nodeValue = next; }
      }
      for (const h of this.collectHeadings(root)) {
        const orig = this.origPhrase.get(h);
        const hit = orig && cache.get(orig);
        if (hit && (h.textContent || '').replace(/\s+/g, ' ').trim() !== hit) h.textContent = hit;
      }
      document.querySelectorAll<HTMLElement>('[placeholder],[title],[aria-label],[alt]').forEach((el) => {
        for (const attr of ATTRS) {
          const key = `otr_${attr.replace('-', '')}`;
          const src = (el.dataset[key] || el.getAttribute(attr) || '').trim();
          const hit = src && cache.get(src);
          if (hit && el.getAttribute(attr) !== hit) el.setAttribute(attr, hit);
        }
      });
    } finally {
      this.applying = false;
    }
  }
}

export const domTranslator = new DomTranslator();
