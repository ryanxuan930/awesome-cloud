# Ryan's Awesome Cloud — 簡報下載站（密碼閘門版）

簡報電腦開網址 → 輸入密碼 → 點大按鈕下載 PPT / PDF，不用 USB、不用登入。

檔案在上傳前就用 AES-256-GCM 加密，GitHub 上只有密文；解密在瀏覽器本機完成，密碼不會送出去。

```
src/         原始簡報（.gitignore 排除，不會上傳）
docs/        GitHub Pages 發佈資料夾：index.html（固定不變）＋ 加密後的 *.bin ＋ meta.json
build.mjs    加密腳本（需要 Node 18+，不用 npm install）
deploy.sh    加密 → commit → push 一條龍
```

## 第一次設定

1. 在這個資料夾建 repo 並推上去。免費帳號的 Pages 需要公開 repo，但上傳的只有密文；原始簡報在 `src/`，已被 `.gitignore` 排除。
   ```bash
   echo "p.你的網域.com" > docs/CNAME      # 自訂網域，先寫好可避免之後 push 衝突
   git init -b main && git add . && git commit -m init
   git ls-files                              # 確認清單裡沒有 src/
   gh repo create awesome-cloud --public --source=. --push
   ```
2. GitHub → repo → Settings → Pages：Source 選 Deploy from branch → `main` / `/docs`；Custom domain 填 `p.你的網域.com`；憑證核發後勾 Enforce HTTPS。
3. DNS：新增一筆 CNAME，`p` 指向 `你的帳號.github.io`。

## 更新簡報 / 換密碼

1. 把新檔放進 `src/`（同名覆蓋；放別的檔名也行，頁面會自動多一顆按鈕）
2. `bash deploy.sh 你的密碼`（約 1 分鐘後上線）

換密碼＝用新密碼再跑一次。想要一組好打的隨機密碼：`node build.mjs --gen`

## 使用現場

瀏覽器輸入網址 → 輸入密碼 → 按「下載 PPT」或「下載 PDF」。
PDF 另有「在瀏覽器直接開啟」，萬一 .pptx 被電腦擋下載，可以開 PDF 後按 F11 全螢幕當簡報用。

密碼**不分大小寫**，全形字會自動轉半形（避免中文輸入法沒切換）。

## 注意事項

- 這是「防觀眾看到網址就直接下載」的強度，不是機密等級。有心人可把密文抓下來離線暴力猜密碼（PBKDF2 60 萬次會拖慢，但擋不住太短的密碼），所以密碼至少 6 字，且不要和其他帳號共用。
- 每次 deploy 都會把新的密文放進 git 歷史；簡報很大、更新很多次後 repo 會變肥（Pages 建議 1 GB 內，單檔上限 100 MB）。必要時刪掉 repo 重建即可。
- 活動結束後，到 Settings → Pages 取消發佈，或直接刪 repo。
- 瀏覽器必須是 https 才能解密（custom domain 要勾 Enforce HTTPS）。
