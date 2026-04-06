#!/usr/bin/env node

const { spawnSync } = require("child_process");

const command = process.argv[2];
const supported = new Set(["deploy", "dev"]);

if (!command || !supported.has(command)) {
  console.error("[migrate-guard] Usage: node scripts/prisma-migrate-guard.cjs <deploy|dev>");
  process.exit(1);
}

const databaseUrl = (process.env.DATABASE_URL || "").trim();
const directUrl = (process.env.DIRECT_URL || "").trim();

if (!databaseUrl) {
  console.error("[migrate-guard] DATABASE_URL is empty. Aborting migration.");
  process.exit(1);
}

const isLocalDb =
  databaseUrl.includes("@db:5432/") ||
  databaseUrl.includes("@localhost:") ||
  databaseUrl.includes("@127.0.0.1:");

const isLocalDirect =
  !directUrl ||
  directUrl.includes("@db:5432/") ||
  directUrl.includes("@localhost:") ||
  directUrl.includes("@127.0.0.1:");

const allowNonLocalMigrate = process.env.ALLOW_NON_LOCAL_MIGRATE === "true";

if ((!isLocalDb || !isLocalDirect) && !allowNonLocalMigrate) {
  console.error("[migrate-guard] Refusing to run migration on non-local DB URL.");
  console.error(
    "[migrate-guard] If this is intentional (CI/prod only), set ALLOW_NON_LOCAL_MIGRATE=true explicitly."
  );
  process.exit(1);
}

const args = command === "deploy" ? ["migrate", "deploy"] : ["migrate", "dev"];

const result = spawnSync("npx", ["prisma", ...args], {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: process.env,
});

if (result.error) {
  console.error("[migrate-guard] Failed to execute migration:", result.error.message);
  process.exit(1);
}

process.exit(result.status == null ? 1 : result.status);
