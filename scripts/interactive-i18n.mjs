import { chromium } from 'playwright';
const BASE = process.env.BASE || 'http://localhost:8080';
const OUT = 'C:/Users/aldaw/AppData/Local/Temp/claude/C--Users-aldaw/8e3628b4-b8ee-42e6-9bec-ac6d5b146fb1/scratchpad/i18n-shots';
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const FLAGS = /🇺🇸|🇸🇦|🇪🇸|🇫🇷|🇧🇷/;
const b = await chromium.launch();
const p = await b.newContext({ viewport: { width: 1366, height: 900 } }).then(c => c.newPage());
await p.goto(BASE + '/pricing', { waitUntil: 'domcontentloaded' });
await sleep(2500);
const h1En = (await p.locator('h1').first().innerText()).slice(0, 60);

const openSelector = async () => { await p.locator('button').filter({ hasText: FLAGS }).first().click(); await sleep(500); };
const pick = async (re) => { await p.getByRole('menuitem', { name: re }).click(); };

await openSelector();
await pick(/🇸🇦/);
await sleep(9000);
const h1Ar = (await p.locator('h1').first().innerText()).slice(0, 60);
const dirAr = await p.evaluate(() => document.documentElement.getAttribute('dir'));
await p.screenshot({ path: `${OUT}/interactive_ar.png` });

await openSelector();
await pick(/🇺🇸/);
await sleep(7000); // includes a page reload (English restore)
const h1Back = (await p.locator('h1').first().innerText()).slice(0, 60);
const dirBack = await p.evaluate(() => document.documentElement.getAttribute('dir'));

console.log(JSON.stringify({
  h1En, h1Ar, dirAr,
  arabicAppliedLive: /[؀-ۿ]/.test(h1Ar) && dirAr === 'rtl',
  h1Back, dirBack,
  restoredToEnglish: h1Back === h1En && dirBack === 'ltr',
}, null, 2));
await b.close();
