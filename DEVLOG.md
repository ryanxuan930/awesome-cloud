# DEVLOG

## 2026-10-29
- 建立專案：`build.mjs`、`docs/index.html`（標題 Ryan's Awesome Cloud）、`deploy.sh`、`README.md`、`.gitignore`。
- 簡報 `Seminar1.pptx`（2.97 MB）與 `Seminar1.pdf`（1.37 MB）已加密至 `docs/`，原檔在 `src/`。
- 實測（Chromium + localhost）全部通過：標題、錯誤密碼不解鎖、密碼大寫可過、全形密碼可過、兩檔分別下載與「全部下載」的 sha256 皆與原檔一致、無 console 錯誤。
- 密碼為隨機產生的 6 字，由使用者自行保管，未記錄於任何檔案。
- 雲端 session 無法在使用者的 GitHub 帳號建立 repo，專案改由本機資料夾 `/Users/ryanchang/Codes/awesome-cloud` 接手。

### 待辦
- [ ] `git init -b main`、建立 GitHub repo 並 push（先確認 `git ls-files` 沒有 `src/`）
- [ ] 決定自訂網域，寫入 `docs/CNAME`
- [ ] GitHub Pages：Source = `main` / `/docs`，填 Custom domain，憑證核發後勾 Enforce HTTPS
- [ ] DNS：新增 CNAME，子網域指向 `<帳號>.github.io`
- [ ] 現場實測：在簡報電腦上用短網址下載一次
