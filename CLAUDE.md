# CLAUDE.md

> 共通のプロジェクト情報（ブランチ命名・コーディング規約・開発環境・テンプレートなど）は **[AGENTS.md](./AGENTS.md)** を参照してください。このファイルは Claude Code 固有の設定のみを記載します。

## Claude Code でのスキルの使い方

スキルは `AGENTS.md` に記載の `.agents/skills/` を正規フォルダとして管理する。Claude Code は `.claude/skills/` → `../.agents/skills/` のシンボリックリンク経由でアクセスする。

| コマンド | 説明 |
|---|---|
| `/create-issue` | GitHub Issue 作成（`.github/ISSUE_TEMPLATE/` を参照） |
| `/create-pr` | develop 向け Pull Request 作成（`.github/PULL_REQUEST_TEMPLATE.md` を参照） |
| `/new-feature` | 新機能実装ワークフロー（Issue → ブランチ → 実装 → PR） |
| `/fix-bug` | バグ修正ワークフロー（Issue → ブランチ → 修正 → PR） |
| `/pr-review` | PR を 6 サブエージェントで並列レビュー（pr-review-toolkit 使用） |

## フォルダ構造（Claude Code 視点）

```
.agents/
├── skills/       ← 全エージェント共通スキル（正規フォルダ）
└── scripts/      ← 全エージェント共通スクリプト（正規フォルダ）
.claude/
├── skills/       ← シンボリックリンク → ../.agents/skills/
└── scripts/      ← シンボリックリンク → ../.agents/scripts/
```

## MCP 設定

`.mcp.json` + `.env.local` で GitHub MCP を有効化済み。
MCP が使える場合は `mcp__github__create_issue` 等のツールを優先して使用すること。
MCP が使えない場合は `$REPO_ROOT/.agents/scripts/github-api.sh` を使用する。
