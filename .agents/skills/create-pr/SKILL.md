---
name: create-pr
description: 作業ブランチからdevelopへのPull Requestを作成する。
argument-hint: --title "タイトル" --issue 42 --branch "gh-42-feature-name"
allowed-tools:
  - Bash
---

# Skill: create-pr

作業ブランチから `develop` へのPull Requestを作成する。

## 対応エージェント
Claude Code, CODEX, その他CLIエージェント

## 前提条件
- `.env.local` に `GITHUB_PERSONAL_ACCESS_TOKEN` が設定済みであること
- 作業ブランチが remote にプッシュ済みであること
- リポジトリ: `Meet-develop/meet-moc`
- デフォルトベースブランチ: `develop`

## ブランチ命名規則
```
gh-{issue番号}-{機能の短い説明をケバブケースで}
例: gh-42-add-triangle-vote
```

## 実行手順

### Step 1 — 変更内容を確認する
```bash
git log develop..HEAD --oneline
git diff develop...HEAD --stat
```

### Step 2 — ブランチをpushする（未pushの場合）
```bash
git push -u origin <branch-name>
```

### Step 3 — PR本文を組み立てる

```markdown
## 概要
（変更内容の簡潔な説明）

## 関連Issue
Closes #<issue番号>

## 変更内容
- （主な変更点1）
- （主な変更点2）

## テスト確認
- [ ] ローカルで動作確認済み
- [ ] 既存機能への影響を確認済み
- [ ] DBマイグレーションが正常に実行できる（DB変更がある場合）
```

### Step 4 — PR作成を実行する

```bash
PROJECT_ROOT="<meet-mocのパス>"
bash "$PROJECT_ROOT/.claude/scripts/github-api.sh" create-pr \
  --title "<PRタイトル>" \
  --branch "<ブランチ名>" \
  --issue <issue番号> \
  --body "..."
```

出力:
```
PR_NUMBER=43
PR_URL=https://github.com/Meet-develop/meet-moc/pull/43
```

### ローカルテスト環境の起動方法
```bash
# Docker アプリ起動（DB + Next.js）
docker compose up -d

# マイグレーション確認
docker compose exec app npm run db:migrate:dev

# ログ確認
docker compose logs -f app
```
