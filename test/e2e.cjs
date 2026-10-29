// 端對端測試：用真實 Chromium 對 localhost 的 docs/ 做解鎖與下載，並比對 sha256
const { chromium } = require('playwright');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const [, , url, pw, srcDir, outDir] = process.argv;
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const fullwidth = (s) => [...s].map((c) => String.fromCharCode(c.charCodeAt(0) + 0xfee0)).join('');
fs.mkdirSync(outDir, { recursive: true });
let fail = 0;
const check = (ok, what) => { console.log((ok ? 'PASS ' : 'FAIL ') + what); if (!ok) fail++; };

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ acceptDownloads: true });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(String(e)));
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

  await p.goto(url);
  check((await p.title()) === "Ryan's Awesome Cloud", 'title = Ryan\'s Awesome Cloud');
  check((await p.textContent('h1')) === "Ryan's Awesome Cloud", 'h1 = Ryan\'s Awesome Cloud');

  // 1. 錯誤密碼
  await p.fill('#pw', 'wrongpw');
  await p.press('#pw', 'Enter');
  await p.waitForFunction(() => document.querySelector('#msg').textContent.includes('錯'));
  check(await p.$eval('#files', (e) => e.hidden), '錯誤密碼：不顯示下載按鈕 (msg=' + (await p.textContent('#msg')) + ')');

  // 2. 正確密碼（故意用大寫）
  await p.fill('#pw', pw.toUpperCase());
  await p.press('#pw', 'Enter');
  await p.waitForSelector('#files:not([hidden]) .dl');
  const labels = await p.$$eval('.dl', (els) => els.map((e) => e.textContent));
  console.log('buttons:', JSON.stringify(labels));
  check(labels.length === 2 && labels[0].startsWith('下載 PPT') && labels[1].startsWith('下載 PDF'), '大寫密碼可解鎖，出現 PPT / PDF 兩顆按鈕');

  const btns = await p.$$('.dl');
  for (const btn of btns) {
    const [d] = await Promise.all([p.waitForEvent('download'), btn.click()]);
    const name = d.suggestedFilename();
    const out = path.join(outDir, 'single_' + name);
    await d.saveAs(out);
    check(sha(out) === sha(path.join(srcDir, name)), `下載 ${name} 的 sha256 與原檔一致`);
  }

  // 3. 全形密碼 + 「全部下載」
  await p.goto(url);
  await p.fill('#pw', fullwidth(pw));
  await p.press('#pw', 'Enter');
  await p.waitForSelector('#files:not([hidden]) .all');
  const got = [];
  p.on('download', async (d) => { const o = path.join(outDir, 'all_' + d.suggestedFilename()); await d.saveAs(o); got.push(d.suggestedFilename()); });
  await p.click('.all');
  await p.waitForFunction(() => true, null, { timeout: 100 });
  for (let i = 0; i < 40 && got.length < 2; i++) await p.waitForTimeout(250);
  await p.waitForTimeout(500);
  check(got.length === 2 && got.every((n) => sha(path.join(outDir, 'all_' + n)) === sha(path.join(srcDir, n))), '全形密碼可解鎖；「全部下載」兩檔 sha256 皆一致 (' + got.join(', ') + ')');

  check(errs.length === 0, '無 console / page 錯誤 ' + JSON.stringify(errs));
  await b.close();
  console.log(fail ? `\n${fail} 項失敗` : '\n全部通過');
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error('測試腳本例外：', e); process.exit(2); });
