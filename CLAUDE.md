# awesome-cloud（Ryan's Awesome Cloud）

簡報下載站：靜態網站，部署在 GitHub Pages（`/docs`）。簡報在上傳前以密碼 AES-256-GCM 加密，瀏覽器內解密後下載。
目的：在別人的簡報電腦上免 USB、免登入，打一行短網址＋一組短密碼就能下載 PPT / PDF，並避免觀眾看到網址就直接下載。

## 結構
- `src/`：原始簡報。已在 `.gitignore`，**絕不可 commit**（repo 為公開）。
- `docs/`：發佈資料夾。`index.html` 手寫、固定不變；`*.bin` 與 `meta.json` 由 `build.mjs` 產生，勿手改；`CNAME` 是自訂網域，build 不會動它。
- `build.mjs`：加密腳本（Node 18+，無相依套件）。`node build.mjs <密碼>`；`node build.mjs --gen` 產生隨機密碼。
- `deploy.sh`：加密 → commit → push。`bash deploy.sh <密碼>`。
- `test/e2e.cjs`：Chromium 端對端測試（需 `npm i playwright` 與 `npx playwright install chromium`）。

## 規則
- 密碼只能從命令列參數或環境變數 `SLIDES_PW` 傳入，**不得寫進任何檔案、commit 訊息或日誌**（包含 README、DEVLOG）。
- `build.mjs` 與 `docs/index.html` 必須同步：密碼正規化（NFKC → trim → 小寫）、PBKDF2-SHA256 次數（由 `meta.json` 帶入）、檔案格式（IV 12 bytes ＋ 密文 ＋ GCM tag）。
- 改動後必須重跑 build，並用 `test/e2e.cjs` 驗證：錯誤密碼不解鎖、下載檔的 sha256 與 `src/` 原檔一致、無 console 錯誤。
  用法：`python3 -m http.server 8765 --directory docs &` 後 `node test/e2e.cjs http://localhost:8765/ <密碼> src /tmp/dl`。
- push 前先 `git ls-files` 確認沒有 `src/`。
- 頁面標題固定為 `Ryan's Awesome Cloud`。
- 每個開發步驟與內容都要寫進 `DEVLOG.md`，以便中斷後接續。
