/**
 * CI スクリーンショットスクリプト
 * GitHub Actions のホスト側から実行し、Docker で起動中の
 * localhost:3000 のスクリーンショットを撮影する。
 *
 * - スマートフォン表示 (390×844) のみ
 * - 撮影結果を /tmp/screenshots/manifest.json に書き出す
 */

"use strict";

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.APP_URL || "http://localhost:3000";
const OUTPUT_DIR = "/tmp/screenshots";

// スマートフォン (iPhone 14 Pro) ビューポート
const VIEWPORT = { width: 390, height: 844 };

// 撮影対象ページ
// ─ 認証不要でレンダリングされるページのみ対象
// ─ 認証が必要なページは screenshot-pr.sh でローカル撮影すること
const PAGES = [
  { name: "home", path: "/" },
  { name: "login", path: "/login" },
];

(async () => {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const browser = await chromium.launch({
    // GitHub Actions は root 実行のため --no-sandbox が必須
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const results = [];

  for (const { name, path: urlPath } of PAGES) {
    const page = await browser.newPage({ viewport: VIEWPORT });
    const outPath = path.join(OUTPUT_DIR, `${name}.png`);

    try {
      const response = await page.goto(BASE_URL + urlPath, {
        waitUntil: "networkidle",
        timeout: 30_000,
      });

      // リダイレクト先も含めてアニメーション完了を待つ
      await page.waitForTimeout(1_500);

      await page.screenshot({ path: outPath, fullPage: false });

      const status = response?.status() ?? "unknown";
      console.log(`[OK] ${urlPath} (HTTP ${status}) → ${outPath}`);
      results.push({ name, path: outPath, url: urlPath, status });
    } catch (err) {
      console.error(`[FAIL] ${urlPath}: ${err.message}`);
      // 失敗してもスクリーンショットが撮れていれば記録する
      if (fs.existsSync(outPath)) {
        results.push({ name, path: outPath, url: urlPath, status: "error" });
      }
    } finally {
      await page.close();
    }
  }

  await browser.close();

  // 後続の upload ステップが読み取るマニフェスト
  const manifestPath = path.join(OUTPUT_DIR, "manifest.json");
  fs.writeFileSync(manifestPath, JSON.stringify(results, null, 2));
  console.log(`\nManifest written: ${manifestPath}`);
  console.log(`Captured ${results.length}/${PAGES.length} pages`);
})().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
