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

## Prismaマイグレーション手順

```bash
# スキーマ変更後
npx prisma migrate dev --name <migration-name>
npx prisma generate
```
