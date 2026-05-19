#!/bin/bash
# ローカルUIスクリーンショットツール
#
# Docker でアプリが起動している状態で実行する。
# 指定URLのスクリーンショットを撮り、GitHub PRにコメントとして投稿する。
#
# 使い方:
#   ./screenshot-pr.sh --pr 51 --urls "/events/YOUR_EVENT_ID"
#   ./screenshot-pr.sh --pr 51 --urls "/,/events/abc-123" --base-url http://localhost:3000

set -euo pipefail

# ── パス解決 ──
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

# ── .env.local 読み込み ──
if [ -f "$PROJECT_ROOT/.env.local" ]; then
  set -a; source "$PROJECT_ROOT/.env.local"; set +a
fi

# ── 設定 ──
TOKEN="${GITHUB_PERSONAL_ACCESS_TOKEN:-}"
REPO="${GITHUB_REPO:-Meet-develop/meet-moc}"
BASE_URL="http://localhost:3000"
PR_NUMBER=""
URLS="/"
SCREENSHOT_DIR="/tmp/meet-moc-screenshots"

# ── 引数パース ──
while [[ $# -gt 0 ]]; do
  case "$1" in
    --pr)        PR_NUMBER="$2"; shift 2 ;;
    --urls)      URLS="$2";      shift 2 ;;
    --base-url)  BASE_URL="$2";  shift 2 ;;
    --dir)       SCREENSHOT_DIR="$2"; shift 2 ;;
    *) echo "Unknown option: $1" >&2; shift ;;
  esac
done

# ── バリデーション ──
if [ -z "$TOKEN" ]; then
  echo "Error: GITHUB_PERSONAL_ACCESS_TOKEN が未設定です (.env.local を確認)" >&2; exit 1
fi
if [ -z "$PR_NUMBER" ]; then
  echo "Error: --pr <PR番号> が必要です" >&2; exit 1
fi

# ── Node.js PATH 解決 (nvm / volta) ──
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  LATEST_NODE=$(ls "$NVM_DIR/versions/node" 2>/dev/null | sort -V | tail -1)
  [ -n "$LATEST_NODE" ] && export PATH="$NVM_DIR/versions/node/$LATEST_NODE/bin:$PATH"
fi
[ -d "$HOME/.volta/bin" ] && export PATH="$HOME/.volta/bin:$PATH"
[ -d "/opt/homebrew/bin" ] && export PATH="/opt/homebrew/bin:$PATH"

# ── アプリ起動確認 ──
echo "🔍 アプリ起動確認: $BASE_URL"
if ! curl -sf "$BASE_URL" > /dev/null 2>&1; then
  echo "Error: $BASE_URL に接続できません。" >&2
  echo "  → docker compose up -d でアプリを起動してください。" >&2
  exit 1
fi
echo "✅ アプリ起動確認OK"

# ── Playwright インストール確認 ──
echo "🔍 Playwright 確認..."
if ! npx --yes playwright --version > /dev/null 2>&1; then
  echo "Playwright が見つかりません。インストール中..." >&2
  npx playwright install chromium --with-deps
fi

# ── スクリーンショット撮影 ──
mkdir -p "$SCREENSHOT_DIR"
IFS=',' read -ra URL_LIST <<< "$URLS"

SCREENSHOT_FILES=()
echo "📸 スクリーンショット撮影中..."

node - <<EOF
const { chromium } = require('playwright');

const BASE_URL = '$BASE_URL';
const URLS = '$URLS'.split(',').map(u => u.trim()).filter(Boolean);
const OUTPUT_DIR = '$SCREENSHOT_DIR';

const VIEWPORTS = [
  { name: 'mobile',   width: 390,  height: 844  },
  { name: 'desktop',  width: 1280, height: 900  },
];

(async () => {
  const browser = await chromium.launch();
  const files = [];

  for (const url of URLS) {
    const slug = url.replace(/\//g, '_').replace(/^_/, '') || 'home';
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      try {
        await page.goto(BASE_URL + url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1000); // アニメーション完了待ち
        const outPath = OUTPUT_DIR + '/' + slug + '-' + vp.name + '.png';
        await page.screenshot({ path: outPath, fullPage: false });
        console.log('SCREENSHOT:' + outPath);
      } catch (e) {
        console.error('Failed to screenshot ' + url + ' (' + vp.name + '):', e.message);
      } finally {
        await page.close();
      }
    }
  }

  await browser.close();
})().catch(err => { console.error(err); process.exit(1); });
EOF

# node の出力からファイルパスを収集
mapfile -t SCREENSHOT_FILES < <(node - <<EOF 2>/dev/null
const { chromium } = require('playwright');
const BASE_URL = '$BASE_URL';
const URLS = '$URLS'.split(',').map(u => u.trim()).filter(Boolean);
const OUTPUT_DIR = '$SCREENSHOT_DIR';
const VIEWPORTS = [
  { name: 'mobile',  width: 390,  height: 844 },
  { name: 'desktop', width: 1280, height: 900 },
];
(async () => {
  const browser = await chromium.launch();
  for (const url of URLS) {
    const slug = url.replace(/\//g, '_').replace(/^_/, '') || 'home';
    for (const vp of VIEWPORTS) {
      const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
      try {
        await page.goto(BASE_URL + url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1000);
        const outPath = OUTPUT_DIR + '/' + slug + '-' + vp.name + '.png';
        await page.screenshot({ path: outPath, fullPage: false });
        console.log(outPath);
      } catch(e) { /* skip */ } finally { await page.close(); }
    }
  }
  await browser.close();
})();
EOF
)

if [ ${#SCREENSHOT_FILES[@]} -eq 0 ]; then
  # ファイルを直接 glob で収集
  mapfile -t SCREENSHOT_FILES < <(find "$SCREENSHOT_DIR" -name "*.png" 2>/dev/null)
fi

echo "撮影完了: ${#SCREENSHOT_FILES[@]} 枚"

# ── GitHub に画像をアップロード ──
upload_image() {
  local file="$1"
  local name="$(basename "$file")"
  curl -s -X POST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Accept: application/vnd.github+json" \
    -H "Content-Type: image/png" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    --data-binary "@$file" \
    "https://uploads.github.com/repos/${REPO}/issues/${PR_NUMBER}/assets?name=${name}" \
    | jq -r '.browser_download_url // empty'
}

echo "⬆️  GitHub にアップロード中..."

# テーブル形式のコメントを組み立てる
COMMENT="## 📸 UIスクリーンショット（ローカル撮影）\n\n"
COMMENT+="| ページ | モバイル (390px) | デスクトップ (1280px) |\n"
COMMENT+="|:---|:---:|:---:|\n"

IFS=',' read -ra URL_LIST <<< "$URLS"
for url in "${URL_LIST[@]}"; do
  url="$(echo "$url" | xargs)"
  slug="$(echo "$url" | sed 's|/|_|g' | sed 's|^_||')"
  [ -z "$slug" ] && slug="home"

  MOBILE_FILE="$SCREENSHOT_DIR/${slug}-mobile.png"
  DESKTOP_FILE="$SCREENSHOT_DIR/${slug}-desktop.png"

  MOBILE_URL=""
  DESKTOP_URL=""

  [ -f "$MOBILE_FILE" ]  && MOBILE_URL="$(upload_image "$MOBILE_FILE")"
  [ -f "$DESKTOP_FILE" ] && DESKTOP_URL="$(upload_image "$DESKTOP_FILE")"

  MOBILE_MD="${MOBILE_URL:+![]($MOBILE_URL)}"
  DESKTOP_MD="${DESKTOP_URL:+![]($DESKTOP_URL)}"
  [ -z "$MOBILE_MD" ]  && MOBILE_MD="（撮影失敗）"
  [ -z "$DESKTOP_MD" ] && DESKTOP_MD="（撮影失敗）"

  PAGE_LABEL="\`${url:-/}\`"
  COMMENT+="| $PAGE_LABEL | $MOBILE_MD | $DESKTOP_MD |\n"
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
  echo "✅ 既存コメントを更新しました (ID: $EXISTING_ID)"
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
