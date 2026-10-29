# DEVLOG

## 2026-10-29
- 建立專案：`build.mjs`、`docs/index.html`（標題 Ryan's Awesome Cloud）、`deploy.sh`、`README.md`、`.gitignore`。
- 簡報 `Seminar1.pptx`（2.97 MB）與 `Seminar1.pdf`（1.37 MB）已加密至 `docs/`，原檔在 `src/`。
- 實測（Chromium + localhost）全部通過：標題、錯誤密碼不解鎖、密碼大寫可過、全形密碼可過、兩檔分別下載與「全部下載」的 sha256 皆與原檔一致、無 console 錯誤。
- 密碼由使用者自行保管，未記錄於任何檔案（初版為隨機 6 字，後來已換成使用者自訂密碼，見下）。
- 雲端 session 無法在使用者的 GitHub 帳號建立 repo，專案改由本機資料夾 `/Users/ryanchang/Codes/awesome-cloud` 接手。

- 本機接手：`git init -b main`，`git ls-files` 確認無 `src/` 後 commit（460031f）。
- 建立公開 repo `ryanxuan930/awesome-cloud` 並 push；以 API 啟用 GitHub Pages（`main` / `/docs`），build 成功。
- 預設網址 `https://ryanxuan930.github.io/awesome-cloud/` 上線：首頁 200、標題正確、`meta.json` 與 `.bin` 皆 200（`.bin` 大小 = 原檔 + 28 bytes）。`index.html` 的 fetch 皆為相對路徑，子路徑可用；https 已強制。
- 本次接手沒有密碼，未重跑 `test/e2e.cjs`；此時 `docs/` 內容尚未變動（之後換密碼才重新加密，見下）。
- 換密碼：用新密碼重跑 `build.mjs`（新 salt、新 IV，`.bin` 檔名隨內容變）。驗證：Node 以 Web Crypto 獨立解密兩檔，sha256 與 `src/` 一致；錯誤密碼不解；全形密碼可解；本機 localhost 實測瀏覽器錯誤密碼顯示「密碼錯誤」、新密碼解鎖出現下載按鈕，無 console 錯誤。密碼未記錄於任何檔案。
- 提醒：舊密碼仍可解開 git 歷史中的舊版 `.bin`；若舊密碼已外流，需刪 repo 重建才算徹底作廢。

### 待辦
- [x] `git init -b main`、建立 GitHub repo 並 push
- [x] GitHub Pages：Source = `main` / `/docs`（預設網域，https 已強制）
- [ ] 用密碼對線上網址跑一次 e2e：`node test/e2e.cjs https://ryanxuan930.github.io/awesome-cloud/ <密碼> src /tmp/dl`
- [ ] （選用）決定自訂網域，寫入 `docs/CNAME`，Pages 填 Custom domain，憑證核發後勾 Enforce HTTPS
- [ ] DNS：新增 CNAME，子網域指向 `<帳號>.github.io`
- [ ] 現場實測：在簡報電腦上用短網址下載一次
