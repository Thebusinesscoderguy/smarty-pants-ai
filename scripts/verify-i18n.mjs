import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:8080';
const OUT = process.env.OUT || 'C:/Users/aldaw/AppData/Local/Temp/claude/C--Users-aldaw/8e3628b4-b8ee-42e6-9bec-ac6d5b146fb1/scratchpad/i18n-shots';
fs.mkdirSync(OUT, { recursive: true });

const PAGES = (process.env.PAGES || '/,/auth,/pricing,/faq').split(',');
const LANGS = [
  { code: 'ar', rtl: true, script: /[؀-ۿ]/ },
  { code: 'es', rtl: false },
  { code: 'fr', rtl: false },
  { code: 'pt', rtl: false },
];

const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const ANON = process.env.ANON;
const FN = 'https://twfzlbockonxopuindaw.supabase.co/functions/v1/translate-text';
// Sentinel English UI strings that appear app-wide (header/footer). We translate
// them via the edge function, then wait until those translations actually render.
const SENTINELS = ['Features', 'Pricing', 'How it works'];
async function expectedFor(lang) {
  const res = await fetch(FN, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ANON}`, apikey: ANON, 'Content-Type': 'application/json' },
    body: JSON.stringify({ texts: SENTINELS, targetLang: lang, sourceLang: 'en' }),
  });
  const j = await res.json();
  return j.translations || [];
}

const browser = await chromium.launch();
const results = [];

// 1) English baselines
const enCtx = await browser.newContext();
const enPage = await enCtx.newPage();
const baseline = {};
for (const path of PAGES) {
  try {
    await enPage.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(2500);
    const t = norm(await enPage.innerText('body'));
    baseline[path] = { latin: (t.match(/[A-Za-z]/g) || []).length };
  } catch (e) { baseline[path] = ''; }
}
await enCtx.close();

// 2) Each language
for (const lang of LANGS) {
  const ctx = await browser.newContext();
  await ctx.addInitScript((code) => {
    try { localStorage.setItem('language', code); } catch {}
  }, lang.code);
  const page = await ctx.newPage();
  if (process.env.DEBUG) {
    page.on('console', (m) => { if (m.text().includes('[tr]')) console.log('   ', m.text().slice(0, 160)); });
    page.on('pageerror', (e) => console.log('   [pageerror]', String(e).slice(0, 200)));
  }
  const expected = (await expectedFor(lang.code)).filter(Boolean);

  for (const path of PAGES) {
    const r = { lang: lang.code, path, translated: false, dirOk: false, arabic: null, sentinels: 0 };
    try {
      await page.goto(BASE + path, { waitUntil: 'domcontentloaded', timeout: 30000 });
      // Wait until the language-correct sentinel translations actually render
      // (proves the translator finished applying), up to ~70s.
      const baseLatin = baseline[path]?.latin || 1;
      let text = '', latin = baseLatin;
      for (let i = 0; i < 12; i++) {
        await sleep(1500);
        text = norm(await page.innerText('body'));
        latin = (text.match(/[A-Za-z]/g) || []).length;
        const present = expected.filter((e) => text.includes(e)).length;
        if (lang.script) {
          if (lang.script.test(text) && latin < baseLatin * 0.55) break;
        } else if (present >= expected.length) break;
      }
      r.sentinels = expected.filter((e) => text.includes(e)).length;
      r.latinPct = Math.round((latin / baseLatin) * 100);
      if (lang.script) r.translated = lang.script.test(text) && latin < baseLatin * 0.5;
      else r.translated = r.sentinels >= Math.max(1, expected.length - 1);
      const dir = await page.evaluate(() => document.documentElement.getAttribute('dir'));
      r.dirOk = lang.rtl ? dir === 'rtl' : dir === 'ltr';
      if (lang.script) r.arabic = lang.script.test(text);
      await page.screenshot({ path: `${OUT}/${lang.code}${path === '/' ? '_home' : path.replace(/\//g, '_')}.png`, fullPage: true });
    } catch (e) {
      r.error = String(e).slice(0, 120);
    }
    results.push(r);
    console.log(`${lang.code} ${path} -> translated=${r.translated} latin=${r.latinPct}% sentinels=${r.sentinels}/${expected.length} dirOk=${r.dirOk}${lang.script ? ` arabic=${r.arabic}` : ''}${r.error ? ` ERR=${r.error}` : ''}`);
  }
  await ctx.close();
}

await browser.close();

const pass = results.filter((r) => r.translated && r.dirOk && (r.arabic !== false)).length;
console.log(`\nSUMMARY: ${pass}/${results.length} page-language combos passed`);
console.log(`screenshots: ${OUT}`);
fs.writeFileSync(`${OUT}/results.json`, JSON.stringify(results, null, 2));
if (pass !== results.length) process.exitCode = 1;
