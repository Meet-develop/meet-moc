---
name: new-feature
description: 新機能を実装する。Issue作成→ブランチ作成→実装→PRまでの一連のワークフローを実行する。
argument-hint: --title "機能名" --description "機能の説明"
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
---

# Skill: new-feature

新機能の実装ワークフロー。Issue作成からPR作成まで一貫して実行する。

## 対応エージェント
Claude Code, CODEX, その他CLIエージェント（`gh` CLI と `git` が使えれば動作する）

## ワークフロー概要

```
1. Issue作成 (.claude/skills/create-issue/SKILL.md に従う)
2. developからブランチ作成
3. 実装
4. コミット
5. PR作成 (.claude/skills/create-pr/SKILL.md に従う)
```

## 前提条件
- `gh` CLI がインストール・認証済みであること
- ベースブランチ: `develop`
- リポジトリ: `Meet-develop/meet-moc`

## 実行手順

### Phase 1 — Issue作成

`.claude/skills/create-issue/SKILL.md` の手順に従ってIssueを作成する。
Issue番号（`ISSUE_NUMBER`）を取得して次のPhaseで使用する。

### Phase 2 — ブランチ作成

```bash
# developの最新を取得
git fetch origin develop
git checkout develop
git pull origin develop

# ブランチを作成・切り替え
git checkout -b gh-${ISSUE_NUMBER}-<feature-slug>
```

`<feature-slug>` はケバブケースで機能を短く表現したもの（例: `add-triangle-vote`）。

### Phase 3 — 実装

機能の仕様に従い実装を行う。以下の観点で進める:
1. DBスキーマ変更が必要な場合は Prisma マイグレーションから始める
2. APIエンドポイントを更新する
3. フロントエンドコンポーネントを更新する
4. 型定義を整合させる

#### Prisma マイグレーション手順（DB変更がある場合）
```bash
cd /path/to/project
# schema.prisma を編集した後:
npx prisma migrate dev --name <migration-name>
npx prisma generate
```

### Phase 4 — コミット

```bash
git add <変更ファイル>
git commit -m "feat: <変更内容の簡潔な説明>

- <詳細1>
- <詳細2>

Refs #${ISSUE_NUMBER}"
```

### Phase 5 — PR作成

`.claude/skills/create-pr/SKILL.md` の手順に従ってPRを作成する。
- base: `develop`
- `Closes #${ISSUE_NUMBER}` を本文に含める

## プロジェクト固有メモ

### テクノロジースタック
- **フレームワーク**: Next.js (App Router)
- **ORM**: Prisma
- **DB**: PostgreSQL
- **言語**: TypeScript

### 重要なディレクトリ
```
app/                    # Next.js App Router
  api/                  # APIルート
  events/[id]/          # イベント詳細ページ
components/features/    # 機能コンポーネント
prisma/
  schema.prisma         # DBスキーマ
  migrations/           # マイグレーション履歴
```

### コーディング規約
- Prismaのenumはキャメルケース（例: `TimeAvailability`）
- APIレスポンスはcamelCase
- DBカラムはsnake_case（`@map`でマッピング）
