#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = process.cwd();
const workflowsDir = path.join(root, ".github", "workflows");

const failures = [];

const checkLine = (filePath, lineNumber, line) => {
  const normalized = line.toLowerCase();

  const hasDangerousSeedCommand =
    normalized.includes("prisma db seed") ||
    normalized.includes("npm run db:seed");

  const hasNonLocalOverride = normalized.includes("allow_non_local_seed=true");

  if (hasDangerousSeedCommand || hasNonLocalOverride) {
    failures.push(`${filePath}:${lineNumber}: ${line.trim()}`);
  }
};

const checkDockerComposeGuard = () => {
  const composePath = path.join(root, "docker-compose.yml");
  if (!fs.existsSync(composePath)) return;

  const content = fs.readFileSync(composePath, "utf8");
  const hasGuard = content.includes("SEED_ON_STARTUP") && content.includes("npm run db:seed");

  if (!hasGuard) {
    failures.push(
      "docker-compose.yml: app startup must not run unconditional seed. Expected SEED_ON_STARTUP guard around db:seed."
    );
  }
};

const checkWorkflows = () => {
  if (!fs.existsSync(workflowsDir)) {
    return;
  }

  const entries = fs.readdirSync(workflowsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith(".yml") && !entry.name.endsWith(".yaml")) continue;

    const filePath = path.join(workflowsDir, entry.name);
    const content = fs.readFileSync(filePath, "utf8");
    const lines = content.split(/\r?\n/);

    lines.forEach((line, index) => {
      checkLine(path.relative(root, filePath), index + 1, line);
    });
  }
};

checkWorkflows();
checkDockerComposeGuard();

if (failures.length > 0) {
  console.error("[ci-check-prod-seed-block] Failed.");
  console.error("The following dangerous patterns were found:");
  failures.forEach((f) => console.error(`- ${f}`));
  process.exit(1);
}

console.log("[ci-check-prod-seed-block] Passed.");
