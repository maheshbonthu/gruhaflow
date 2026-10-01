/**
 * Smoke-check helper used during development: prints the spread of handover
 * progress and ticket SLA health straight from the database, so the dashboard
 * numbers can be verified against the source data.
 *
 *   node scripts/check.cjs
 */
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const dbName = process.env.MONGODB_DB || "urbanfirm";

(async () => {
  const client = await new MongoClient(uri).connect();
  const db = client.db(dbName);

  const bookings = await db.collection("bookings").find({}).toArray();
  const buckets = { "0-25%": 0, "26-50%": 0, "51-75%": 0, "76-99%": 0, "100%": 0 };

  for (const b of bookings) {
    const steps = await db.collection("journeySteps").find({ bookingId: b._id }).toArray();
    const pct = Math.round(
      (steps.filter((s) => s.status === "DONE").length / steps.length) * 100
    );
    const key =
      pct === 100 ? "100%" : pct > 75 ? "76-99%" : pct > 50 ? "51-75%" : pct > 25 ? "26-50%" : "0-25%";
    buckets[key] += 1;
  }

  console.log(`bookings: ${bookings.length}`);
  console.log("handover progress spread:");
  for (const [k, v] of Object.entries(buckets)) console.log(`  ${k.padEnd(8)} ${v}`);

  const now = new Date();
  const open = await db
    .collection("tickets")
    .countDocuments({ status: { $nin: ["RESOLVED", "CLOSED"] } });
  const breached = await db
    .collection("tickets")
    .countDocuments({ status: { $nin: ["RESOLVED", "CLOSED"] }, slaDueAt: { $lt: now } });
  const overdueSteps = await db
    .collection("journeySteps")
    .countDocuments({ status: { $ne: "DONE" }, dueAt: { $lt: now } });

  console.log(`\nopen tickets: ${open}, past SLA: ${breached}`);
  console.log(`overdue handover milestones: ${overdueSteps}`);

  const byStage = await db
    .collection("leads")
    .aggregate([{ $group: { _id: "$stage", n: { $sum: 1 } } }, { $sort: { n: -1 } }])
    .toArray();
  console.log("\nleads by stage:");
  let total = 0;
  for (const r of byStage) {
    console.log(`  ${String(r._id).padEnd(22)} ${r.n}`);
    total += r.n;
  }
  console.log(`  ${"TOTAL".padEnd(22)} ${total}`);

  await client.close();
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
