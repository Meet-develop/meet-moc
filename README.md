# meet-moc

飲み会・ごはん会などのイベント作成、参加、招待、通知を行う Next.js アプリです。

## 技術スタック

- Next.js (App Router)
- Prisma
- PostgreSQL
- Supabase (Auth / Storage)
- Docker Compose

## 前提環境

- Docker / Docker Compose
- Node.js 20 系推奨

## クイックスタート（Docker ローカルDB）

1. リポジトリ直下に `.env` を作成（このリポジトリには `.env.example` はありません）。
2. 最低限、以下を設定します。

```bash
NEXT_PUBLIC_SUPABASE_URL="https://<YOUR_PROJECT_REF>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<YOUR_SUPABASE_ANON_KEY>"
GOOGLE_PLACES_API_KEY="<YOUR_GOOGLE_PLACES_API_KEY>"
APP_ORIGIN="http://localhost:3000"

# LINEログイン用
# Supabase標準LINE Provider: line
# Custom OIDC Provider: custom:<provider-id>
NEXT_PUBLIC_SUPABASE_LINE_PROVIDER="custom:line"
NEXT_PUBLIC_SUPABASE_LINE_SCOPES="openid profile"
# ログイン時の友だち追加導線（normal / aggressive）
NEXT_PUBLIC_LINE_BOT_PROMPT="aggressive"

# Docker ローカルDBを使う場合は DATABASE_URL をコメントアウトのままにする
# DATABASE_URL="postgresql://postgres:<YOUR_SUPABASE_DB_PASSWORD>@db.<YOUR_PROJECT_REF>.supabase.co:5432/postgres?sslmode=require&pgbouncer=true"
```

3. 起動します。

```bash
docker compose up --build
```

補足:

- 起動時 seed はデフォルトで無効です。必要な場合のみ `SEED_ON_STARTUP=true` を指定してください。

必要に応じて、開発データを投入します（本番では実行しない）。

```bash
docker compose exec app npm run db:seed
```

4. アクセス先

- App: http://localhost:3000
- Postgres: localhost:5432（db: meet_moc, user: postgres, password: postgres）

停止:

```bash
docker compose down
```

## DB切り替え（Docker PostgreSQL <-> Supabase PostgreSQL）

`docker-compose.yml` では次の設定になっています。

```yml
DATABASE_URL: "${DATABASE_URL:-postgresql://postgres:postgres@db:5432/meet_moc}"
```

- `.env` で `DATABASE_URL` が未設定（コメントアウト）の場合:
	Docker ローカルDB（`db`）を利用
- `.env` で `DATABASE_URL` を設定した場合:
	Supabase PostgreSQL を利用

重要:

- 本番運用では、ローカル開発用 `.env` に本番 `DATABASE_URL` を入れないでください。
- 推奨は「ローカル用」と「本番用」で環境変数ファイルを分離することです。
- 復旧手順は [docs/supabase-backup-recovery-runbook.md](docs/supabase-backup-recovery-runbook.md) を参照してください。

## Supabase セットアップ（詳細）

以下は、Supabase を新規に用意してこのアプリを動かすまでの手順です。

### 1. プロジェクト作成

1. Supabase で新規プロジェクトを作成
2. Project URL と anon key を控える
3. Database password を控える

### 2. .env 設定

`.env` に以下を設定します。

```bash
NEXT_PUBLIC_SUPABASE_URL="https://<YOUR_PROJECT_REF>.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="<YOUR_SUPABASE_ANON_KEY>"
GOOGLE_PLACES_API_KEY="<YOUR_GOOGLE_PLACES_API_KEY>"
APP_ORIGIN="http://localhost:3000"

# LINEログイン用
# Supabase標準LINE Provider: line
# Custom OIDC Provider: custom:<provider-id>
NEXT_PUBLIC_SUPABASE_LINE_PROVIDER="custom:line"
NEXT_PUBLIC_SUPABASE_LINE_SCOPES="openid profile"
# ログイン時の友だち追加導線（normal / aggressive）
NEXT_PUBLIC_LINE_BOT_PROMPT="aggressive"

# Supabase DB を使う場合のみ有効化
DATABASE_URL="postgresql://postgres:<YOUR_SUPABASE_DB_PASSWORD>@db.<YOUR_PROJECT_REF>.supabase.co:5432/postgres?sslmode=require&pgbouncer=true"

# LINE 通知を使う場合のみ設定
# LINE_MESSAGING_CHANNEL_ACCESS_TOKEN="<YOUR_LINE_CHANNEL_ACCESS_TOKEN>"
```

### 3. Authentication 設定

Supabase Dashboard で以下を設定します。

- Authentication -> URL Configuration -> Site URL
	- `http://localhost:3000`
- Authentication -> URL Configuration -> Additional Redirect URLs
	- `http://localhost:3000/auth/callback`

### 3.1 ログイン時に公式LINEを追加する（任意）

LINE Developers で次を設定すると、LINEログイン時に公式LINEの友だち追加を表示できます。

- LINE Login チャネルと Messaging API チャネルを同一 Provider 配下にする
- LINE Login チャネルの Linked LINE Official Account で通知用公式アカウントをリンクする
- アプリ側で `NEXT_PUBLIC_LINE_BOT_PROMPT` を `normal` または `aggressive` に設定する

注意:

- 友だち追加の表示と、通知配信先の `lineUserId` 紐付けは別問題です。
- チャネルが分かれている構成では、Webhook + アカウント連携フローでユーザー紐付けが必要になる場合があります。

### 4. DB スキーマ適用（Prisma / 本番）

`DATABASE_URL` を Supabase に向けた状態で、マイグレーションを適用します。

```bash
docker compose exec app npm run db:migrate
docker compose exec app npm run db:generate
```

補足:

- 本番環境では `db:seed` を実行しないでください（seed は開発検証用データ投入のため）。

### 4.1 ローカル検証データ投入（開発のみ）

```bash
docker compose exec app npm run db:seed
```

seed 実行にはガードが入っており、ローカルDB以外では拒否されます。
意図的に非ローカルDBへ seed する場合のみ、明示的に次を使用してください。

```bash
docker compose exec app npm run db:seed:nonlocal
```

### 5. RLS 設定（profiles）

Supabase SQL Editor で [supabase/profiles_rls.sql](supabase/profiles_rls.sql) を実行してください。

### 6. Storage 設定（ユーザーアイコン）

Supabase SQL Editor で [supabase/storage_avatars.sql](supabase/storage_avatars.sql) を実行してください。

この SQL で次を設定します。

- `avatars` バケット作成（存在時は更新）
- 公開読み取り
- 認証ユーザーが `auth.uid()/...` 配下のみ書き込み・更新・削除
- バケット上限サイズ 100KB

アプリ側の挙動:

- 画像アップロード前にクライアント側で自動圧縮
- 100KB 以下になるまで JPEG 品質調整 + リサイズ
- 保存先バケットは `avatars`

## Prisma 操作コマンド

```bash
# 本番運用（推奨）
docker compose exec app npm run db:migrate
docker compose exec app npm run db:generate

# 開発ローカルのみ
docker compose exec app npm run db:seed

# 参照
docker compose exec app npm run db:studio
```

## 主な画面

- `/login`: ログイン
- `/signup`: 新規登録
- `/profile/setup`: プロフィール設定
- `/events/new`: イベント作成
- `/events/[id]`: イベント詳細
- `/events/[id]/manage`: オーナー管理
- `/notifications`: 通知一覧

## 補足

- Place 検索結果は `place_cache` テーブルにキャッシュされます。
- LINE 通知を有効化する場合は、LINE Messaging API のチャネルアクセストークンを `.env` に設定してください。
- CI では [.github/workflows/prisma-safety.yml](.github/workflows/prisma-safety.yml) により、本番向け seed 実行パターンをブロックします。
