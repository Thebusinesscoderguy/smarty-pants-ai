## Goal
Restrict app languages to English and Arabic only, and ensure Arabic works seamlessly across the entire UI.

## Changes

### 1. Lock language options to EN + AR
- `src/types/language.ts` — narrow `Language` type to `'en' | 'ar'`.
- `src/components/LanguageSelector.tsx` — remove all other languages from the dropdown list (keep only English 🇺🇸 and العربية 🇸🇦).
- `src/utils/languageUtils.ts` — update `isValidLanguage` to only accept `en` and `ar`; migrate any stored non-EN/AR value to `en`.
- `src/data/translations.ts` — keep only `en` and `ar` translation maps; remove unused locales so bundle stays small.

### 2. Make Arabic seamless
- `src/contexts/LanguageContext.tsx` — already toggles `dir="rtl"` and `lang-ar` class on `<html>`; verify Arabic font + RTL apply globally.
- `src/index.css` — confirm `.lang-ar` rules (Arabic font stack, RTL-friendly spacing). Add fixes for any LTR-only utilities (e.g., margins/icons that need mirroring) using logical properties where missing.
- Audit and fix common RTL issues in shared chrome:
  - `src/components/layout/Header.tsx`, `Footer.tsx`, `MobileBottomNav.tsx`, `AppSidebar.tsx` — wrap with `dir` awareness, mirror icons (chevrons, send arrows), swap `ml-*`/`mr-*` for `ms-*`/`me-*` where it breaks.
  - Toast/dropdown/sheet alignment in Arabic.
- Ensure any hard-coded English strings in always-visible chrome use `t(...)` so Arabic users see Arabic.

### 3. Backend prompt cleanup (light touch)
- Edge functions that branch on language (`chat-completion`, `ask-question`, `ai-tutor`, `generate-*`) already handle `ar`. No schema changes; leave other-language branches harmless (dead) — no risk since UI can no longer send them.

## Out of scope
- No changes to translation content quality beyond what's already in `translations.ts` for `ar`.
- No new translation provider work (DeepL pipeline stays as-is, just unused for removed locales).

## Verification
- Switch to Arabic → entire app flips to RTL, Arabic font renders, nav/sidebar/forms/toasts mirror correctly, no English leakage in chrome.
- Switch back to English → LTR restored, no layout regressions.
- LocalStorage with an old value like `fr` auto-resets to `en`.
