const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
const testsRoot = path.resolve(process.cwd(), "tests");

const collectTestFiles = (dir, files) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      collectTestFiles(fullPath, files);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith(".test.ts")) {
      files.push(fullPath);
    }
  }
};

const run = () => {
  if (!fs.existsSync(testsRoot)) {
    console.log("[tests] tests directory not found. Skipping.");
    process.exit(0);
  }

  const testFiles = [];
  collectTestFiles(testsRoot, testFiles);
  testFiles.sort();

  if (testFiles.length === 0) {
    console.log("[tests] No test files found under tests/**/*.test.ts");
    process.exit(0);
  }

  for (const testFile of testFiles) {
    const rel = path.relative(process.cwd(), testFile);
    console.log(`[tests] Running ${rel}`);

    const result = spawnSync(npmCmd, ["exec", "tsx", rel], {
      stdio: "inherit",
      env: process.env,
    });

    if (result.error) {
      console.error(`[tests] Failed to run ${rel}:`, result.error);
      process.exit(1);
    }

    if (result.status !== 0) {
      process.exit(result.status || 1);
    }
  }

  console.log(`[tests] All ${testFiles.length} test files passed.`);
};

run();
