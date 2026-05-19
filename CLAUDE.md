# CLAUDE.md

このファイルはClaudeCodeおよびその他のAIエージェント（CODEX等）がこのリポジトリで作業する際のガイドです。

## プロジェクト概要

**meet-moc** — イベントの日程調整・出欠確認Webアプリ。

- **フレームワーク**: Next.js (App Router)
- **ORM**: Prisma
- **DB**: PostgreSQL
- **言語**: TypeScript
- **リポジトリ**: `Meet-develop/meet-moc`
- **デフォルトブランチ**: `develop`（mainはリリース用）

## Skillsの使い方

`.claude/skills/` 以下に再利用可能なワークフロースキルが定義されている。
各SKILL.mdは Claude Code の `/` コマンドとして使えるほか、CODEX等の他エージェントも手順書として参照できる。

| スキル | 説明 |
|---|---|
| `.claude/skills/create-issue/SKILL.md` | GitHub Issue作成（テンプレート付き） |
| `.claude/skills/create-pr/SKILL.md` | develop向けPull Request作成 |
| `.claude/skills/new-feature/SKILL.md` | 新機能実装ワークフロー（Issue→ブランチ→実装→PR） |
| `.claude/skills/release/SKILL.md` | リリースワークフロー（develop→main→タグ→GitHub Release） |
| `.claude/skills/fix-bug/SKILL.md` | バグ修正ワークフロー（Issue→ブランチ→修正→PR） |

## ブランチ命名規則

```
gh-{issue番号}-{機能・修正の短い説明（ケバブケース）}
例: gh-42-add-triangle-vote
    gh-43-fix-vote-null-error
```

## コーディング規約

- Prisma enumはPascalCase（例: `TimeAvailability`）
- DB カラムはsnake_case（`@map` でマッピング）
- APIレスポンスはcamelCase
- コミットメッセージは `feat:` / `fix:` / `chore:` 等のConventional Commitsに従う

## 重要なディレクトリ

```
app/
  api/events/[id]/votes/   # 投票API
  events/[id]/             # イベント詳細ページ
components/features/events/ # イベント関連コンポーネント
prisma/
  schema.prisma            # DBスキーマ（変更時はmigrate dev）
  migrations/              # マイグレーション履歴
.github/ISSUE_TEMPLATE/    # Issueテンプレート
```

## ローカル開発環境の起動

このプロジェクトは **Docker Compose** でローカルDBごと起動する。
`npm run db:migrate` をホストで直接実行すると `db:5432` に接続できないエラーが出るため、**必ずDockerを使うこと**。

### 通常の起動（推奨）

```bash
# .env を作成（初回のみ）
# Supabase URL・APIキー・Google Places APIキーを設定
cp .env.example .env   # ← .env.example は存在しないので README.md を参照

# 起動（DB + Next.js + 自動マイグレーション）
docker compose up --build

# バックグラウンド起動
docker compose up -d --build

# ログ確認
docker compose logs -f app
```

### マイグレーションを手動で適用する

```bash
# Dockerコンテナ内で実行（ローカルDB向け）
docker compose exec app npm run db:migrate:dev

# 本番/Supabase DBに直接適用する場合（.env の DATABASE_URL のコメントアウトを外す）
npm run db:migrate:prod
```

### テストデータ投入

```bash
docker compose exec app npm run db:seed
```

### 停止・リセット

```bash
docker compose down          # 停止（DBデータは保持）
docker compose down -v       # 停止 + DBデータ削除
```

## Prismaスキーマ変更時の手順

```bash
# 1. schema.prisma を編集
# 2. マイグレーションを作成・適用
docker compose exec app npm run db:migrate:dev
# （マイグレーション名を聞かれるので入力）

# または migration.sql を手動作成した場合
docker compose exec app npm run db:migrate
```
