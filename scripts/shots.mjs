/**
 * Captures desktop and mobile screenshots of the pages named on the command
 * line, into docs/screenshots/.
 *
 *   node scripts/shots.mjs styleguide
 *   node scripts/shots.mjs styleguide:3100 properties
 *
 * Expects a server already running on BASE (default http://127.0.0.1:3100).
 * Deliberately a dev tool, not part of the build.
 */
import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE ?? "http://127.0.0.1:3100";
const OUT = "docs/screenshots";

/** §4 of the brief: test at 360, 768, 1280 and 1920. */
const VIEWPORTS = [
  { name: "desktop-1280", width: 1280, height: 900, dsf: 1 },
  { name: "mobile-360", width: 360, height: 780, dsf: 2, mobile: true },
];

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error("Usage: node scripts/shots.mjs <path> [<path>...]");
  process.exit(1);
}

await mkdir(OUT, { recursive: true });

const browser = await chromium.launch();
try {
  for (const target of targets) {
    const path = target.startsWith("/") ? target : `/${target}`;
    const slug = path.replace(/^\//, "").replace(/[^a-z0-9]+/gi, "-") || "home";

    for (const vp of VIEWPORTS) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: vp.dsf,
        isMobile: Boolean(vp.mobile),
        hasTouch: Boolean(vp.mobile),
        // Screenshots must show the static design, not mid-animation frames.
        reducedMotion: "reduce",
      });
      const page = await context.newPage();

      const res = await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60_000 });
      if (!res || res.status() >= 400) {
        console.error(`  ✗ ${path} @ ${vp.name} → HTTP ${res ? res.status() : "no response"}`);
        await context.close();
        continue;
      }
      // Let webfonts settle so type is never captured in the fallback face.
      await page.evaluate(() => document.fonts?.ready);
      await page.waitForTimeout(400);

      const file = `${OUT}/${slug}-${vp.name}.png`;
      await page.screenshot({ path: file, fullPage: true });
      console.log(`  ✓ ${file}`);
      await context.close();
    }
  }
} finally {
  await browser.close();
}
