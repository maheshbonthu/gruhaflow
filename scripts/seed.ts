/**
 * Local seeding: `npm run seed`.
 * In a deployed environment use `POST /api/seed` with the SEED_TOKEN instead.
 */
import { config } from "dotenv";
import { resolve } from "node:path";

config({ path: resolve(process.cwd(), ".env.local") });
config({ path: resolve(process.cwd(), ".env") });

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI is not set. Copy .env.example to .env.local first.");
    process.exit(1);
  }

  const { seedDatabase } = await import("../src/lib/seed");
  const { getClient } = await import("../src/lib/mongodb");

  console.log(`Seeding ${process.env.MONGODB_DB ?? "urbanfirm"}…`);
  const started = Date.now();
  const summary = await seedDatabase();

  console.log(`\nDone in ${((Date.now() - started) / 1000).toFixed(1)}s:\n`);
  for (const [key, value] of Object.entries(summary)) {
    console.log(`  ${key.padEnd(14)} ${value}`);
  }
  console.log("\nSign in with admin@theurbanfirm.in / demo1234");

  const client = await getClient();
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
