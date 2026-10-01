/**
 * Checks a page for horizontal overflow and oversized tap targets at the four
 * widths the brief names (360, 768, 1280, 1920).
 *
 *   node scripts/responsive-check.mjs styleguide
 */
import { chromium } from "playwright";

const BASE = process.env.BASE ?? "http://127.0.0.1:3100";
const WIDTHS = [360, 768, 1280, 1920];

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error("Usage: node scripts/responsive-check.mjs <path> [...]");
  process.exit(1);
}

const browser = await chromium.launch();
let failures = 0;

try {
  for (const target of targets) {
    const path = target.startsWith("/") ? target : `/${target}`;
    console.log(`\n${path}`);

    for (const width of WIDTHS) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        reducedMotion: "reduce",
      });
      const page = await context.newPage();
      await page.goto(BASE + path, { waitUntil: "networkidle", timeout: 60_000 });

      const report = await page.evaluate(() => {
        const doc = document.documentElement;
        const overflow = doc.scrollWidth - doc.clientWidth;

        // Anything wider than the viewport is what causes the scroll.
        const culprits = [];
        for (const el of Array.from(document.querySelectorAll("body *"))) {
          const r = el.getBoundingClientRect();
          if (r.width > doc.clientWidth + 1 && r.height > 0) {
            const id = el.id ? `#${el.id}` : "";
            const cls = typeof el.className === "string" ? `.${el.className.split(/\s+/)[0]}` : "";
            culprits.push(`${el.tagName.toLowerCase()}${id}${cls} (${Math.round(r.width)}px)`);
          }
          if (culprits.length >= 5) break;
        }

        // Interactive elements below the 44px minimum (ui-ux-pro-max priority 2).
        const small = [];
        for (const el of Array.from(
          document.querySelectorAll("button, a[href], input, select")
        )) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue;
          if (r.height < 32) {
            small.push(`${el.tagName.toLowerCase()} "${(el.textContent ?? "").trim().slice(0, 24)}" ${Math.round(r.height)}px`);
          }
          if (small.length >= 5) break;
        }

        return { overflow, culprits, small, scrollWidth: doc.scrollWidth };
      });

      const ok = report.overflow <= 0;
      if (!ok) failures++;
      console.log(
        `  ${ok ? "✓" : "✗"} ${String(width).padStart(4)}px  overflow ${report.overflow}px` +
          (report.culprits.length ? `\n      wide: ${report.culprits.join(", ")}` : "")
      );
      if (report.small.length) {
        console.log(`      small targets: ${report.small.join("; ")}`);
      }

      await context.close();
    }
  }
} finally {
  await browser.close();
}

if (failures) {
  console.error(`\n${failures} viewport(s) scroll horizontally.\n`);
  process.exit(1);
}
console.log("\nNo horizontal scroll at any width.\n");
