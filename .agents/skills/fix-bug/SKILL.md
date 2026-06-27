---
name: fix-bug
description: バグを修正する。Issue作成→ブランチ作成→修正→PRまでの一連のワークフローを実行する。
argument-hint: --title "バグ概要" --description "再現手順と期待動作"
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
---

# Skill: fix-bug

バグ修正ワークフロー。Issue作成からPR作成まで一貫して実行する。

## 対応エージェント
Claude Code, CODEX, その他CLIエージェント（`gh` CLI と `git` が使えれば動作する）

## ワークフロー概要

```
1. Issueを作成（バグ報告テンプレート）
2. developからhotfixブランチを作成
3. バグを修正
4. コミット
5. PR作成（developへ）
```

## 前提条件
- `gh` CLI がインストール・認証済みであること
- ベースブランチ: `develop`
- リポジトリ: `Meet-develop/meet-moc`

## 実行手順

### Phase 1 — Issue作成

バグ報告のIssueを作成する。

```bash
gh issue create \
  --repo Meet-develop/meet-moc \
  --title "[BUG] <バグの概要>" \
  --label "bug" \
  --body "$(cat <<'EOF'
## バグの概要
（何が起きているか）

## 再現手順
1. ...
2. ...
3. ...

## 期待される動作
（本来どうあるべきか）

## 実際の動作
（実際に何が起きているか）

## 環境
- OS: 
- ブラウザ: 
- バージョン: 

## 補足
（スクリーンショット、ログなど）
EOF
)"
```

Issue番号（`ISSUE_NUMBER`）を取得して次のPhaseで使用する。

### Phase 2 — ブランチ作成

```bash
git fetch origin develop
git checkout develop
git pull origin develop
git checkout -b gh-${ISSUE_NUMBER}-fix-<bug-slug>
```

`<bug-slug>` はケバブケースでバグを短く表現したもの（例: `fix-vote-null-error`）。

### Phase 3 — バグ修正

根本原因を特定してから修正する。
- ログ・エラーメッセージを読む
- 再現ケースを把握する
- 最小限の変更で修正する（副作用を避ける）

### Phase 4 — コミット

```bash
git add <変更ファイル>
git commit -m "fix: <バグの修正内容>

- <修正詳細>

Fixes #${ISSUE_NUMBER}"
```

### Phase 5 — PR作成

`.claude/skills/create-pr/SKILL.md` の手順に従ってPRを作成する。
- base: `develop`
- `Fixes #${ISSUE_NUMBER}` を本文に含める

## プロジェクト固有メモ

### よくあるバグの調査起点
```bash
# Prismaのクエリエラー確認
# app/api/ 以下のAPIルートを確認
# components/ 以下のコンポーネントを確認

# TypeScriptの型エラー確認
npx tsc --noEmit

# Prismaスキーマの整合性確認
npx prisma validate
```
