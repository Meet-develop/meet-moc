#!/bin/bash
# ローカルUIスクリーンショットツール
#
# Docker でアプリが起動している状態で実行する。
# 指定URLのスクリーンショット（スマートフォン表示）を撮り、GitHub PR にコメントとして投稿する。
#
# 使い方:
#   ./screenshot-pr.sh --pr 51 --urls "/events/YOUR_EVENT_ID"
#   ./screenshot-pr.sh --pr 51 --urls "/,/events/abc-123" --base-url http://localhost:3000

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ── .env.local 読み込み ──
if [ -f "$PROJECT_ROOT/.env.local" ]; then
  set -a; source "$PROJECT_ROOT/.env.local"; set +a
fi

TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN:-}"
REPO="${GITHUB_REPO:-Meet-develop/meet-moc}"
BASE_URL="http://localhost:3000"
PR_NUMBER=""
URLS="/"
SCREENSHOT_DIR="/tmp/meet-moc-screenshots"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --pr)        PR_NUMBER="$2"; shift 2 ;;
    --urls)      URLS="$2";      shift 2 ;;
    --base-url)  BASE_URL="$2";  shift 2 ;;
    --dir)       SCREENSHOT_DIR="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; shift ;;
  esac
done

if [ -z "$TOKEN" ]; then
  echo "Error: GITHUB_PERSONAL_ACCESS_TOKEN が未設定です (.env.local を確認)" >&2; exit 1
fi
if [ -z "$PR_NUMBER" ]; then
  echo "Error: --pr <PR番号> が必要です" >&2; exit 1
fi

# ── Node.js PATH 解決 (nvm / volta / homebrew) ──
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  LATEST_NODE=$(ls "$NVM_DIR/versions/node" 2>/dev/null | sort -V | tail -1)
  [ -n "$LATEST_NODE" ] && export PATH="$NVM_DIR/versions/node/$LATEST_NODE/bin:$PATH"
fi
[ -d "$HOME/.volta/bin" ] && export PATH="$HOME/.volta/bin:$PATH"
[ -d "/opt/homebrew/bin" ] && export PATH="/opt/homebrew/bin:$PATH"
[ -d "/usr/local/bin"    ] && export PATH="/usr/local/bin:$PATH"

# ── アプリ起動確認 ──
echo "🔍 アプリ起動確認: $BASE_URL"
STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL" 2>/dev/null || echo "000")
if [ "$STATUS" = "000" ]; then
  echo "Error: $BASE_URL に接続できません。" >&2
  echo "  → docker compose up -d でアプリを起動してください。" >&2
  exit 1
fi
echo "✅ アプリ起動確認OK (HTTP $STATUS)"

# ── playwright 確認・インストール ──
echo "🔍 Playwright 確認..."
if ! node -e "require('playwright')" 2>/dev/null; then
  echo "playwright をインストール中..."
  npm install --prefix /tmp/playwright-local playwright 2>/dev/null
  export NODE_PATH="/tmp/playwright-local/node_modules"
  npx --prefix /tmp/playwright-local playwright install chromium 2>/dev/null || true
fi

mkdir -p "$SCREENSHOT_DIR"

# ── スクリーンショット撮影（スマートフォン表示: 390×844）──
echo "📸 スクリーンショット撮影中 (スマートフォン 390×844)..."

IFS=',' read -ra URL_LIST <<< "$URLS"

node - <<NODEJS
const { chromium } = require(
  (() => {
    try { require.resolve('playwright'); return 'playwright'; }
    catch { return '/tmp/playwright-local/node_modules/playwright'; }
  })()
);
const fs = require('fs');

const BASE_URL = '${BASE_URL}';
const URLS = '${URLS}'.split(',').map(u => u.trim()).filter(Boolean);
const OUTPUT_DIR = '${SCREENSHOT_DIR}';

// スマートフォン (iPhone 14 Pro) ビューポート
const VIEWPORT = { width: 390, height: 844 };

(async () => {
  const browser = await chromium.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  for (const url of URLS) {
    const slug = url.replace(/\//g, '_').replace(/^_/, '') || 'home';
    const outPath = OUTPUT_DIR + '/' + slug + '.png';
    const page = await browser.newPage({ viewport: VIEWPORT });
    try {
      const resp = await page.goto(BASE_URL + url, {
        waitUntil: 'networkidle',
        timeout: 30000
      });
      await page.waitForTimeout(1500);
      await page.screenshot({ path: outPath, fullPage: false });
      console.log('[OK] ' + url + ' (HTTP ' + (resp?.status() ?? '?') + ') → ' + outPath);
    } catch(e) {
      console.error('[FAIL] ' + url + ': ' + e.message);
    } finally {
      await page.close();
    }
  }

  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
NODEJS

echo "撮影完了"

# ── GitHub に画像をアップロード ──
upload_image() {
  local file="$1" name="$2"
  curl -sf -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: image/png" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    --data-binary "@$file" \
    "https://uploads.github.com/repos/${REPO}/issues/${PR_NUMBER}/assets?name=${name}" \
    | jq -r '.browser_download_url // empty' 2>/dev/null || echo ""
}

echo "⬆️  GitHub にアップロード中..."

COMMENT="## 📸 UIスクリーンショット（ローカル撮影）\n\n"
COMMENT+="| ページ | スマートフォン (390px) |\n"
COMMENT+="|:---|:---:|\n"

for url in "${URL_LIST[@]}"; do
  url="$(echo "$url" | xargs)"
  slug="$(echo "$url" | sed 's|/|_|g' | sed 's|^_||')"
  [ -z "$slug" ] && slug="home"

  FILE="$SCREENSHOT_DIR/${slug}.png"
  IMG_MD="（撮影失敗）"

  if [ -f "$FILE" ]; then
    URL_RESULT="$(upload_image "$FILE" "${slug}.png")"
    [ -n "$URL_RESULT" ] && IMG_MD="![]($URL_RESULT)"
  fi

  COMMENT+="| \`${url:-/}\` | $IMG_MD |\n"
done

COMMENT+="\n> 📅 撮影日時: $(date '+%Y-%m-%d %H:%M:%S')"

# ── 既存コメントを更新 or 新規投稿 ──
EXISTING_ID=$(curl -s \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/vnd.github+json" \
  "https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments" \
  | jq -r '.[] | select(.body | startswith("## 📸 UIスクリーンショット")) | .id' | head -1)

BODY_JSON="$(printf '%b' "$COMMENT" | jq -Rs .)"

if [ -n "$EXISTING_ID" ]; then
  curl -s -X PATCH \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -d "{\"body\": $BODY_JSON}" \
    "https://api.github.com/repos/${REPO}/issues/comments/${EXISTING_ID}" > /dev/null
  echo "✅ 既存コメントを更新しました"
else
  curl -s -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -d "{\"body\": $BODY_JSON}" \
    "https://api.github.com/repos/${REPO}/issues/${PR_NUMBER}/comments" > /dev/null
  echo "✅ スクリーンショットをPR #${PR_NUMBER} に投稿しました"
fi

echo ""
echo "🎉 完了! PR: https://github.com/${REPO}/pull/${PR_NUMBER}"
