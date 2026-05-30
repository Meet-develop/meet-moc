#!/usr/bin/env node

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const allowToken = "migration-safety: allow-destructive";

const fail = (message) => {
  console.error(`[ci-check-migration-safety] ${message}`);
  process.exit(1);
};

const run = (command) =>
  execSync(command, {
    cwd: root,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

const quote = (value) => `'${value.replace(/'/g, "'\\''")}'`;

const getBaseRef = () => {
  const baseRef = (process.env.GITHUB_BASE_REF || "").trim();
  if (baseRef) {
    const remoteRef = `origin/${baseRef}`;
    try {
      run(`git rev-parse --verify ${quote(remoteRef)}`);
      return remoteRef;
    } catch {
      // fallback below
    }
  }

  const before = (process.env.GITHUB_EVENT_BEFORE || "").trim();
  if (before && !/^0+$/.test(before)) {
    return before;
  }

  try {
    run("git rev-parse --verify HEAD~1");
    return "HEAD~1";
  } catch {
    return "";
  }
};

const listChangedMigrationFiles = (baseRef) => {
  if (!baseRef) return [];

  const output = run(
    `git diff --name-only ${quote(`${baseRef}...HEAD`)} -- 'prisma/migrations/**/migration.sql'`
  ).trim();

  if (!output) return [];

  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
};

const getAddedLines = (baseRef, filePath) => {
  const diff = run(
    `git diff --unified=0 ${quote(`${baseRef}...HEAD`)} -- ${quote(filePath)}`
  );

  return diff
    .split(/\r?\n/)
    .filter((line) => line.startsWith("+") && !line.startsWith("+++"))
    .map((line) => line.slice(1));
};

const hasAllowToken = (filePath) => {
  const absolute = path.join(root, filePath);
  if (!fs.existsSync(absolute)) return false;
  const content = fs.readFileSync(absolute, "utf8").toLowerCase();
  return content.includes(allowToken);
};

const dangerousPatterns = [
  { name: "DROP TABLE", regex: /\bdrop\s+table\b/i },
  { name: "DROP COLUMN", regex: /\bdrop\s+column\b/i },
  {
    name: "ALTER TABLE DROP CONSTRAINT",
    regex: /\balter\s+table\b[\s\S]*\bdrop\s+constraint\b/i,
  },
  { name: "TRUNCATE", regex: /\btruncate\s+(table\s+)?\b/i },
  { name: "DELETE FROM", regex: /\bdelete\s+from\b/i },
  { name: "DROP SCHEMA", regex: /\bdrop\s+schema\b/i },
  { name: "DROP TYPE", regex: /\bdrop\s+type\b/i },
];

const main = () => {
  const baseRef = getBaseRef();

  if (!baseRef) {
    console.log("[ci-check-migration-safety] Skip: could not determine diff base ref.");
    process.exit(0);
  }

  const changedFiles = listChangedMigrationFiles(baseRef);

  if (changedFiles.length === 0) {
    console.log("[ci-check-migration-safety] No changed migration.sql files.");
    process.exit(0);
  }

  const findings = [];

  for (const filePath of changedFiles) {
    if (hasAllowToken(filePath)) {
      console.log(
        `[ci-check-migration-safety] Skip destructive check by token in ${filePath}`
      );
      continue;
    }

    const addedLines = getAddedLines(baseRef, filePath);

    addedLines.forEach((line, index) => {
      const normalized = line.replace(/--.*$/, "").trim();
      if (!normalized) return;

      for (const pattern of dangerousPatterns) {
        if (pattern.regex.test(normalized)) {
          findings.push({
            filePath,
            line: index + 1,
            pattern: pattern.name,
            sql: normalized,
          });
          break;
        }
      }
    });
  }

  if (findings.length > 0) {
    console.error("[ci-check-migration-safety] Failed.");
    console.error("Detected dangerous SQL additions in migration.sql:");
    findings.forEach((finding) => {
      console.error(
        `- ${finding.filePath} [${finding.pattern}] ${finding.sql}`
      );
    });
    console.error(
      `If this migration is intentional, add '-- ${allowToken}' to the migration.sql and explain in PR.`
    );
    fail("Dangerous migration statement detected.");
  }

  console.log("[ci-check-migration-safety] Passed.");
};

main();
