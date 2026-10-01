/**
 * Lists every placeholder image still awaiting a real asset.
 *
 *   npm run placeholders
 *
 * Exits non-zero while any remain, so it can gate a launch checklist.
 */
import { PLACEHOLDERS, outstandingPlaceholders } from "../src/data/placeholders";

const outstanding = outstandingPlaceholders();

console.log(`\nPlaceholder images: ${PLACEHOLDERS.length} registered, ${outstanding.length} outstanding\n`);

for (const p of outstanding) {
  console.log(`  ${p.id}`);
  console.log(`    used for : ${p.usage}`);
  console.log(`    source   : ${p.source} — ${p.sourceUrl}`);
  console.log(`    credit   : ${p.photographer}`);
  console.log(`    alt      : ${p.alt}\n`);
}

if (!outstanding.length) {
  console.log("  All placeholders have been replaced.\n");
  process.exit(0);
}
console.log(`Replace each one, set replaced: true, and re-run.\n`);
process.exit(1);
