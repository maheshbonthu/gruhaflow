/**
 * Starts a throwaway MongoDB on a fixed port for local development and smoke
 * testing, so you can run the app without Atlas or Docker. Data is discarded
 * when the process exits. Not used in production.
 *
 *   node scripts/devdb.mjs            # listens on 27017 until killed
 */
import { MongoMemoryServer } from "mongodb-memory-server";

const port = Number(process.env.DEVDB_PORT ?? 27017);

const mongod = await MongoMemoryServer.create({
  instance: { port, dbName: "gruhaflow" },
});

console.log(`devdb listening at ${mongod.getUri()}`);
console.log("Press Ctrl+C to stop. All data is discarded on exit.");

const shutdown = async () => {
  await mongod.stop();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// Keep the process alive.
setInterval(() => {}, 1 << 30);
