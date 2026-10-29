#!/usr/bin/env bash
# 重新加密 src/ 內的檔案，並推上 GitHub（約 1 分鐘後上線）
# 用法：./deploy.sh 密碼        或   SLIDES_PW=密碼 ./deploy.sh
set -euo pipefail
cd "$(dirname "$0")"
PW="${1:-${SLIDES_PW:-}}"
[ -n "$PW" ] || { echo "用法：./deploy.sh 密碼"; exit 1; }
node build.mjs "$PW"
git add docs
git commit -m "update slides" || echo "（沒有變更可提交）"
git push
