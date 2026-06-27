#!/bin/bash
# GitHub MCP Server 起動ラッパー
# .env.local を読み込んでから @modelcontextprotocol/server-github を起動する。
# nvm / volta / asdf / Homebrew のどれでも動作するよう PATH を解決する。

set -e

# ── Node.js / npx の PATH 解決 ──
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
if [ -s "$NVM_DIR/nvm.sh" ]; then
  # nvm が使えない (Claude Code のシェル環境) 場合は最新バージョンのパスを直接追加
  LATEST_NODE=$(ls "$NVM_DIR/versions/node" 2>/dev/null | sort -V | tail -1)
  if [ -n "$LATEST_NODE" ]; then
    export PATH="$NVM_DIR/versions/node/$LATEST_NODE/bin:$PATH"
  fi
fi
# volta
[ -d "$HOME/.volta/bin" ] && export PATH="$HOME/.volta/bin:$PATH"
# asdf
[ -f "$HOME/.asdf/asdf.sh" ] && \. "$HOME/.asdf/asdf.sh"
# Homebrew (Apple Silicon / Intel)
[ -d "/opt/homebrew/bin" ] && export PATH="/opt/homebrew/bin:$PATH"
[ -d "/usr/local/bin"    ] && export PATH="/usr/local/bin:$PATH"

# ── .env.local 読み込み ──
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env.local"

if [ -f "$ENV_FILE" ]; then
  # コメント行・空行を除いて export
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
else
  echo "[mcp-github] Warning: .env.local が見つかりません。" >&2
  echo "[mcp-github] 以下を実行してください: cp .env.example .env.local" >&2
fi

# ── トークン確認 ──
if [ -z "$GITHUB_PERSONAL_ACCESS_TOKEN" ]; then
  echo "[mcp-github] Error: GITHUB_PERSONAL_ACCESS_TOKEN が設定されていません。" >&2
  echo "[mcp-github] .env.local にトークンを設定してください。" >&2
  exit 1
fi

# ── MCP サーバー起動 ──
exec npx -y @modelcontextprotocol/server-github
