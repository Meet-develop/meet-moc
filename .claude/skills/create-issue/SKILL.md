---
name: create-issue
description: GitHubにIssueを作成する。機能追加はfeature_request、バグ修正はbug_reportテンプレートを使用する。
argument-hint: --title "タイトル" --type feature|bug --body "本文"
allowed-tools:
  - Bash
  - Read
---

# Skill: create-issue

GitHub Issue を作成する。プロジェクトのIssueテンプレートに従ってフォーマットする。

## 対応エージェント
Claude Code, CODEX, その他CLIエージェント（`gh` CLI が使えれば動作する）

## 前提条件
- `gh` CLI がインストール・認証済みであること
- リポジトリ: `Meet-develop/meet-moc`

## Issueテンプレート

### 機能実装 (feature_request)
タイトル: `[TASK] <機能名>`
ラベル: `implementation, enhancement`

```
## 概要
（この機能が何のために必要なのか、ユーザーにどのような価値を提供するのかを簡潔に記述）

## ゴール (AC: Acceptance Criteria)
どのような状態になれば「完了」とするかをリストアップ:
- [ ] （完了条件1）
- [ ] （完了条件2）

## 仕様・設計詳細
- **UI/UX:** （デザインや画面構成）
- **ロジック:** （計算式やバリデーションルール）
- **DB変更:** （スキーマ変更、既存データへの影響）

## タスクリスト
- [ ] データベースのマイグレーション
- [ ] APIエンドポイントの実装
- [ ] フロントエンドのコンポーネント作成

## 関連情報
- 関連するIssue: #
- 参考ドキュメント:
- 懸念点・トレードオフ:
```

### バグ修正 (bug_report)
タイトル: `[BUG] <バグ概要>`
ラベル: `bug`

## 実行方法（優先順位順）

### 方法A — GitHub MCP（Claude Code 推奨）
Claude Code でMCPが有効な場合（`.mcp.json` + `.env.local` 設定済み）、MCPの `create_issue` ツールを直接使用する。

### 方法B — github-api.sh（MCP不使用 / CODEX / CI）
`.env.local` にトークンが設定されていれば即時実行できる。

```bash
PROJECT_ROOT="<meet-mocのパス>"
SCRIPT="$PROJECT_ROOT/.claude/scripts/github-api.sh"

# 機能追加の場合
bash "$SCRIPT" create-issue \
  --title "[TASK] <タイトル>" \
  --label "implementation,enhancement" \
  --body "$(cat <<'EOF'
## 概要
...

## ゴール (AC: Acceptance Criteria)
- [ ] ...

## 仕様・設計詳細
- **UI/UX:** ...
- **ロジック:** ...
- **DB変更:** ...

## タスクリスト
- [ ] ...

## 関連情報
- 関連するIssue: #
- 参考ドキュメント:
- 懸念点・トレードオフ:
EOF
)"

# バグ修正の場合
bash "$SCRIPT" create-issue \
  --title "[BUG] <タイトル>" \
  --label "bug" \
  --body "..."
```

出力:
```
ISSUE_NUMBER=42
ISSUE_URL=https://github.com/Meet-develop/meet-moc/issues/42
```

### Step 3 — Issue番号を記録する
出力の `ISSUE_NUMBER` を取得し、後続の作業（ブランチ名など）で使用する。
