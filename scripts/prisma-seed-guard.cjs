#!/usr/bin/env node

const { spawnSync } = require("child_process");

const databaseUrl = (process.env.DATABASE_URL || "").trim();

if (!databaseUrl) {
  console.error("[seed-guard] DATABASE_URL is empty. Aborting seed.");
  process.exit(1);
}

const isLocalDb =
  databaseUrl.includes("@db:5432/") ||
  databaseUrl.includes("@localhost:") ||
  databaseUrl.includes("@127.0.0.1:");

const allowNonLocalSeed = process.env.ALLOW_NON_LOCAL_SEED === "true";

if (!isLocalDb && !allowNonLocalSeed) {
  console.error("[seed-guard] Refusing to run seed on non-local DATABASE_URL.");
  console.error(
    "[seed-guard] If this is intentional, set ALLOW_NON_LOCAL_SEED=true explicitly."
  );
  process.exit(1);
}

const result = spawnSync("npx", ["tsx", "prisma/seed.ts"], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

if (result.error) {
  console.error("[seed-guard] Failed to execute seed:", result.error.message);
  process.exit(1);
}

process.exit(result.status == null ? 1 : result.status);
