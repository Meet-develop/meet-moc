---
name: create-pr
description: 作業ブランチからdevelopへのPull Requestを作成する。UIの変更がある場合はスクリーンショットを自動取得してPRに添付する。
argument-hint: --title "タイトル" --issue 42 --branch "gh-42-feature-name"
allowed-tools:
  - Bash
---

# Skill: create-pr

作業ブランチから `develop` へのPull Requestを作成する。
UIファイル（`app/`, `components/`, `public/`）が変更されている場合は、スクリーンショットを自動撮影してPRに添付する。

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

### Step 1 — 変更内容とUI変更の有無を確認する
```bash
git log develop..HEAD --oneline
git diff develop...HEAD --stat

# UIファイルの変更を検出
UI_CHANGED=$(git diff develop...HEAD --name-only | grep -E "^(app|components|public)/" | wc -l)
echo "UI変更ファイル数: $UI_CHANGED"
```

### Step 2 — ブランチをpushする（未pushの場合）
```bash
git push -u origin <branch-name>
```

### Step 3 — PR本文を組み立てる

UIの変更がある場合は「スクリーンショット」セクションを含める:

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

## スクリーンショット
<!-- UIの変更がある場合 — screenshot-pr.sh が自動で画像を追記します -->
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

### Step 5 — UIの変更がある場合: スクリーンショットを撮影・添付する

**条件**: Step 1 で `UI_CHANGED > 0` の場合のみ実行する。

#### 5-1. Docker アプリが起動していることを確認

```bash
curl -sf http://localhost:3000 > /dev/null && echo "OK" || echo "起動していません"
# 起動していない場合: docker compose up -d
```

#### 5-2. スクリーンショット撮影 & PR投稿

```bash
PROJECT_ROOT="<meet-mocのパス>"

bash "$PROJECT_ROOT/.claude/scripts/screenshot-pr.sh" \
  --pr <PR_NUMBER> \
  --urls "<スクリーンショットを撮りたいパス（カンマ区切り）>"
```

URLの選び方:
- 変更したコンポーネントが表示されるページのパスを指定
- `app/events/[id]/page.tsx` の変更 → `/events/<実際のイベントID>`
- `app/page.tsx` の変更 → `/`
- ログインが必要なページの場合: まずブラウザで手動ログインした後、Playwright の認証セッションを使う（詳細は下記）

#### 5-3. 認証が必要なページのスクリーンショット（手動補足）

認証済みページはローカルブラウザで手動撮影し、PRコメントに追加することを推奨する。
GitHub Actions（`pr-ui-screenshots.yml`）は公開ページを自動撮影するが、認証ページは対象外。

## スクリーンショット自動化の仕組み

| 方法 | タイミング | 対象ページ |
|---|---|---|
| **GitHub Actions** (`pr-ui-screenshots.yml`) | PR作成・更新時に自動 | 公開ページ（`/`, `/login`等）|
| **ローカルスクリプト** (`screenshot-pr.sh`) | 開発者が手動実行 | 認証済みページ含む任意のURL |

### ローカルテスト環境の起動方法
```bash
# Docker アプリ起動（DB + Next.js）
docker compose up -d

# マイグレーション確認
docker compose exec app npm run db:migrate:dev

# ログ確認
docker compose logs -f app
```
