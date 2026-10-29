#!/usr/bin/env node
// 把 src/ 內的檔案用密碼加密，輸出到 docs/（GitHub Pages 發佈資料夾）
// 用法：node build.mjs <密碼>         或   SLIDES_PW=密碼 node build.mjs
//       node build.mjs --gen         產生一組好打的隨機密碼
//
// 加密方式：PBKDF2-SHA256（60 萬次）由密碼導出金鑰 → AES-256-GCM。
// 所有檔案共用同一把金鑰（同一個 salt），每個檔案各有獨立的隨機 IV。
// docs/index.html 在瀏覽器內用 Web Crypto 做相同步驟解密，密碼不會離開簡報電腦。
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { webcrypto as crypto, createHash, randomInt } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'docs');
const ITER = 600_000; // 次數會寫進 meta.json，index.html 自動沿用

// 密碼先正規化：全形→半形、去頭尾空白、轉小寫。
// index.html 做一模一樣的處理，所以輸入時不分大小寫、中文輸入法誤開全形也能過。
const norm = (s) => s.normalize('NFKC').trim().toLowerCase();

const MIME = {
  '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  '.ppt': 'application/vnd.ms-powerpoint',
  '.key': 'application/x-iwork-keynote-sffkey',
  '.pdf': 'application/pdf',
  '.zip': 'application/zip',
  '.mp4': 'video/mp4',
};

if (process.argv[2] === '--gen') {
  const A = 'abcdefghjkmnpqrstuvwxyz23456789'; // 去掉 i l o 0 1 等易混字
  console.log(Array.from({ length: 6 }, () => A[randomInt(A.length)]).join(''));
  process.exit(0);
}

const raw = process.argv[2] ?? process.env.SLIDES_PW;
if (!raw) {
  console.error('用法：node build.mjs <密碼>\n（產生隨機密碼：node build.mjs --gen）');
  process.exit(1);
}
const pw = norm(raw);
if (pw.length < 6) console.warn('⚠️  密碼少於 6 字，容易被暴力破解；建議 6 字以上。');

let entries = [];
try {
  entries = await readdir(SRC, { withFileTypes: true });
} catch {}
const names = entries.filter((e) => e.isFile() && !e.name.startsWith('.')).map((e) => e.name);
if (!names.length) {
  console.error('src/ 內沒有檔案，請先把簡報放進 src/');
  process.exit(1);
}
const rank = (n) => ({ '.pptx': 0, '.ppt': 0, '.key': 0, '.pdf': 1 })[path.extname(n).toLowerCase()] ?? 2;
names.sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));

const te = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const base = await crypto.subtle.importKey('raw', te.encode(pw), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' },
  base,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt'],
);

await mkdir(OUT, { recursive: true });
for (const f of await readdir(OUT)) if (f.endsWith('.bin')) await rm(path.join(OUT, f)); // 清掉舊版密文，保留 CNAME 等其他檔

const files = [];
for (const name of names) {
  const data = await readFile(path.join(SRC, name));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data));
  const blob = Buffer.concat([iv, ct]); // 檔案格式：IV(12 bytes) + 密文 + GCM tag
  const id = createHash('sha256').update(blob).digest('hex').slice(0, 12) + '.bin'; // 檔名隨內容變，不怕瀏覽器快取
  await writeFile(path.join(OUT, id), blob);
  const mime = MIME[path.extname(name).toLowerCase()] ?? 'application/octet-stream';
  files.push({ name, enc: id, size: data.length, mime });
  console.log(`✔ ${name}  (${(data.length / 1048576).toFixed(2)} MB) → docs/${id}`);
}

await writeFile(
  path.join(OUT, 'meta.json'),
  JSON.stringify({ v: 1, iter: ITER, salt: Buffer.from(salt).toString('base64'), files }, null, 1),
);
await writeFile(path.join(OUT, '.nojekyll'), '');
console.log('完成。docs/ 已更新。');
