This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Docker (PostgreSQL)

This project can run entirely in Docker with a PostgreSQL database.

```bash
docker compose up --build
```

- App: http://localhost:3000
- Postgres: localhost:5432 (db: meet_moc, user: postgres, password: postgres)

To stop and remove containers:

```bash
docker compose down
```

## Environment Variables

Copy `.env.example` to `.env` and set the following:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `GOOGLE_PLACES_API_KEY`

Place search results are cached in the `place_cache` table to reduce API usage.

## Prisma (Schema + Seed)

Prisma is set up for type-safe DB access. The database schema is defined in
`prisma/schema.prisma` and applied via Prisma migrations.

Apply migrations, generate the Prisma client, and seed data inside the app container:

```bash
docker compose exec app npm run db:migrate
docker compose exec app npx prisma generate
docker compose exec app npm run db:seed
```

## Key Screens

- `/onboarding`: Supabase login (email/password for test)
- `/profile/setup`: profile details
- `/events/new`: create event
- `/events/[id]`: event detail
- `/events/[id]/manage`: owner actions
- `/notifications`: notifications

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
