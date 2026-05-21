/**
 * CI スクリーンショットスクリプト
 *
 * - PR で変更されたファイルから .claude/screenshot-targets.json で
 *   撮影対象（URL + 必要な認証ユーザー）を解決する
 * - Playwright で localStorage に Supabase fake session を注入してから
 *   各ページを訪問し、スマートフォンサイズで full page スクリーンショットを取る
 * - 複数枚撮った場合は sharp で横並びに結合し combined.png として出力する
 * - 結果は /tmp/screenshots/manifest.json に記録される
 *
 * Inputs (env):
 *   CHANGED_FILES — 改行区切りの変更ファイル一覧 (`git diff --name-only base...HEAD`)
 *   APP_URL       — 既定 http://localhost:3000
 *   SUPABASE_URL  — 既定 http://localhost:54321 (storage key の ref 算出に使う)
 *
 * Outputs:
 *   /tmp/screenshots/<label>.png   — 個別スクリーンショット
 *   /tmp/screenshots/combined.png  — 横並び結合画像（複数の場合のみ）
 *   /tmp/screenshots/manifest.json — { combined?, items: [{ label, path }] }
 */

"use strict";

const { chromium } = require("playwright");
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.APP_URL || "http://localhost:3000";
const SUPABASE_URL = process.env.SUPABASE_URL || "http://localhost:54321";
const OUTPUT_DIR = "/tmp/screenshots";
const TARGETS_PATH = path.resolve(
  __dirname,
  "..",
  "screenshot-targets.json"
);
const VIEWPORT = { width: 390, height: 844 };

// ── ユーティリティ ────────────────────────────────────────

/** Supabase storage key の ref を URL から算出 (例: http://localhost:54321 → "localhost") */
function deriveSupabaseRef(url) {
  try {
    const host = new URL(url).hostname;
    return host.split(".")[0] || "ref";
  } catch {
    return "ref";
  }
}

/** ファイルパスを minimatch 風のグロブにマッチさせる簡易実装 */
function matchGlob(filePath, pattern) {
  // 正規表現メタ文字をエスケープ（[id] などのブラケットも literal 扱いにする）。* はあとで処理。
  let regex = pattern.replace(/[.+^${}()|\[\]]/g, "\\$&");
  // ** → .*  (パス区切りを含むワイルドカード)
  regex = regex.replace(/\*\*/g, "::DOUBLESTAR::");
  // * → [^/]* (パス区切りを含まないワイルドカード)
  regex = regex.replace(/\*/g, "[^/]*");
  regex = regex.replace(/::DOUBLESTAR::/g, ".*");
  return new RegExp("^" + regex + "$").test(filePath);
}

/** 変更ファイル一覧と targets を突き合わせ、ユニークな対象リストを返す */
function resolveTargets(changedFiles, config) {
  const matched = new Map(); // key: url, value: { label, url, auth }
  for (const file of changedFiles) {
    for (const target of config.targets) {
      if (matchGlob(file, target.match)) {
        const key = `${target.url}|${target.auth ?? ""}`;
        if (!matched.has(key)) {
          matched.set(key, {
            label: target.label,
            url: target.url,
            auth: target.auth,
          });
        }
      }
    }
  }
  return Array.from(matched.values());
}

/** Supabase の fake セッションを localStorage に注入する初期化スクリプト */
function buildAuthInitScript(seedUserId, supabaseRef) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const session = {
    access_token: "ci-fake-jwt",
    refresh_token: "ci-fake-refresh",
    expires_in: 3600,
    expires_at: expiresAt,
    token_type: "bearer",
    user: {
      id: seedUserId,
      aud: "authenticated",
      role: "authenticated",
      email: "ci@example.com",
      email_confirmed_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      app_metadata: { provider: "email", providers: ["email"] },
      user_metadata: {},
    },
  };
  const key = `sb-${supabaseRef}-auth-token`;
  return `
    try {
      window.localStorage.setItem(${JSON.stringify(key)}, ${JSON.stringify(JSON.stringify(session))});
    } catch (_) {}
  `;
}

// ── メイン ────────────────────────────────────────────────

(async () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // 1) 変更ファイル一覧を読む
  const changedRaw = process.env.CHANGED_FILES || "";
  const changedFiles = changedRaw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);

  console.log(`変更ファイル数: ${changedFiles.length}`);
  if (changedFiles.length === 0) {
    console.log("変更ファイルが0件のため、スクリーンショットをスキップします");
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "manifest.json"),
      JSON.stringify({ items: [], skipped: true, reason: "no-changes" }, null, 2)
    );
    return;
  }

  // 2) targets 設定を読み込み解決
  const config = JSON.parse(fs.readFileSync(TARGETS_PATH, "utf8"));
  const targets = resolveTargets(changedFiles, config);

  console.log(`対象ページ数: ${targets.length}`);
  targets.forEach((t) =>
    console.log(`  - ${t.label} (${t.url}, auth=${t.auth ?? "none"})`)
  );

  if (targets.length === 0) {
    console.log("UI 対象の変更がないため、スクリーンショットをスキップします");
    fs.writeFileSync(
      path.join(OUTPUT_DIR, "manifest.json"),
      JSON.stringify({ items: [], skipped: true, reason: "no-ui-changes" }, null, 2)
    );
    return;
  }

  // 3) Playwright 起動
  const supabaseRef = deriveSupabaseRef(SUPABASE_URL);
  console.log(`Supabase storage ref: ${supabaseRef}`);

  const browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const items = [];
  for (const target of targets) {
    const slug = target.label.replace(/[^\p{L}\p{N}_-]+/gu, "_");
    const outPath = path.join(OUTPUT_DIR, `${slug}.png`);

    const context = await browser.newContext({ viewport: VIEWPORT });
    if (target.auth) {
      const seedUserId = config.seed[target.auth];
      if (!seedUserId) {
        console.error(`[WARN] seed.${target.auth} が見つかりません`);
      } else {
        await context.addInitScript(
          buildAuthInitScript(seedUserId, supabaseRef)
        );
      }
    }

    const page = await context.newPage();
    // ブラウザ console と pageerror を出力（デバッグ用）
    page.on("console", (msg) => {
      if (msg.type() === "error" || msg.type() === "warning") {
        console.log(`  [browser:${msg.type()}] ${msg.text()}`);
      }
    });
    page.on("pageerror", (err) => {
      console.log(`  [page error] ${err.message}`);
    });
    page.on("requestfailed", (req) => {
      console.log(`  [req failed] ${req.url()} - ${req.failure()?.errorText}`);
    });
    try {
      // Next.js dev は初回アクセス時にページコンパイル(数十秒)が走るため、
      // networkidle は使わない(HMR の WebSocket でずっと busy)。
      // 1) domcontentloaded で SSR 出力を取得（compile 込みで余裕を持って60秒）
      const response = await page.goto(BASE_URL + target.url, {
        waitUntil: "domcontentloaded",
        timeout: 60_000,
      });
      // 2) load イベントまで待つ（失敗しても続行）
      await page
        .waitForLoadState("load", { timeout: 20_000 })
        .catch(() => console.log(`  (load タイムアウト、続行)`));
      // 3) Supabase auth → API fetch → state 反映までの待機
      await page.waitForTimeout(4_000);

      await page.screenshot({ path: outPath, fullPage: true });
      const status = response?.status() ?? "unknown";
      console.log(`[OK] ${target.url} (HTTP ${status}) → ${outPath}`);
      items.push({ label: target.label, url: target.url, path: outPath, status });
    } catch (err) {
      console.error(`[FAIL] ${target.url}: ${err.message}`);
      // 失敗してもページの現状を撮っておく（デバッグ用に空白でないなら保存）
      try {
        await page.screenshot({ path: outPath, fullPage: true });
        if (fs.existsSync(outPath)) {
          items.push({
            label: target.label,
            url: target.url,
            path: outPath,
            status: "partial",
          });
          console.log(`  → 失敗時スクショを保存: ${outPath}`);
        }
      } catch (_) {
        // ignore
      }
    } finally {
      await page.close();
      await context.close();
    }
  }

  await browser.close();

  // 4) 横並び結合
  const manifest = { items };
  if (items.length >= 2) {
    const GAP = 16;
    const LABEL_HEIGHT = 48;
    const LABEL_FONT_SIZE = 22;

    const metas = await Promise.all(
      items.map((it) => sharp(it.path).metadata())
    );
    const buffers = await Promise.all(items.map((it) => sharp(it.path).toBuffer()));
    const maxHeight = Math.max(...metas.map((m) => m.height || 0)) + LABEL_HEIGHT;
    const widths = metas.map((m) => m.width || 0);
    const totalWidth =
      widths.reduce((a, b) => a + b, 0) + GAP * (items.length - 1);

    const composites = [];
    let leftCursor = 0;
    for (let i = 0; i < items.length; i++) {
      const w = widths[i];
      // ラベルテキスト (SVG)
      const labelSvg = Buffer.from(`
        <svg width="${w}" height="${LABEL_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="#f3f4f6"/>
          <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
                font-family="-apple-system,Helvetica,Arial,sans-serif"
                font-size="${LABEL_FONT_SIZE}" font-weight="600" fill="#111827">
            ${items[i].label.replace(/</g, "&lt;").replace(/>/g, "&gt;")}
          </text>
        </svg>
      `);
      composites.push({ input: labelSvg, left: leftCursor, top: 0 });
      composites.push({
        input: buffers[i],
        left: leftCursor,
        top: LABEL_HEIGHT,
      });
      leftCursor += w + GAP;
    }

    const combinedPath = path.join(OUTPUT_DIR, "combined.png");
    await sharp({
      create: {
        width: totalWidth,
        height: maxHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite(composites)
      .png()
      .toFile(combinedPath);

    manifest.combined = combinedPath;
    console.log(`横並び結合: ${combinedPath} (${totalWidth}x${maxHeight})`);
  } else if (items.length === 1) {
    manifest.combined = items[0].path;
  }

  fs.writeFileSync(
    path.join(OUTPUT_DIR, "manifest.json"),
    JSON.stringify(manifest, null, 2)
  );
  console.log(`完了: ${items.length} 枚撮影`);
})().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
