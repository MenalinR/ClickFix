// One-off maintenance script: geocodes customer addresses, hardware shop
// locations, and job destinations that predate the geocoding feature and
// are still stuck at [0,0]/unset. Safe to re-run — it only touches records
// that don't already have real coordinates.
//
// Usage: node scripts/backfillGeocoding.js   (run from the backend/ dir)

const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const Customer = require("../models/Customer");
const HardwareShop = require("../models/HardwareShop");
const Job = require("../models/Job");
const { geocodeAddress } = require("../utils/geocode");

const hasRealCoordinates = (coordinates) =>
  Array.isArray(coordinates) &&
  coordinates.length === 2 &&
  Number.isFinite(coordinates[0]) &&
  Number.isFinite(coordinates[1]) &&
  (coordinates[0] !== 0 || coordinates[1] !== 0);

// Small delay between geocode calls so a large backfill doesn't burst past
// the Geocoding API's per-second rate limit.
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function backfillCustomers() {
  const customers = await Customer.find({ "addresses.0": { $exists: true } });
  let fixed = 0;
  let skipped = 0;
  let failed = 0;

  for (const customer of customers) {
    let changed = false;
    for (const addr of customer.addresses) {
      if (hasRealCoordinates(addr.location?.coordinates)) {
        skipped++;
        continue;
      }
      const coordinates = await geocodeAddress({
        address: addr.address,
        city: addr.city,
      });
      await sleep(200);
      if (coordinates) {
        addr.location = { type: "Point", coordinates };
        changed = true;
        fixed++;
      } else {
        failed++;
        console.warn(
          `  ⚠️  Could not geocode customer ${customer._id} address: "${addr.address}, ${addr.city || ""}"`,
        );
      }
    }
    if (changed) await customer.save();
  }

  console.log(
    `Customers: ${fixed} address(es) geocoded, ${skipped} already had coordinates, ${failed} failed`,
  );
}

async function backfillShops() {
  const shops = await HardwareShop.find({});
  let fixed = 0;
  let skipped = 0;
  let failed = 0;

  for (const shop of shops) {
    if (hasRealCoordinates(shop.location?.coordinates)) {
      skipped++;
      continue;
    }
    const coordinates = await geocodeAddress({
      address: shop.address,
      city: shop.city,
    });
    await sleep(200);
    if (coordinates) {
      shop.location = { type: "Point", coordinates };
      await shop.save();
      fixed++;
    } else {
      failed++;
      console.warn(
        `  ⚠️  Could not geocode shop ${shop._id} (${shop.shopName}) address: "${shop.address}, ${shop.city || ""}"`,
      );
    }
  }

  console.log(
    `Hardware shops: ${fixed} location(s) geocoded, ${skipped} already had coordinates, ${failed} failed`,
  );
}

async function backfillJobs() {
  const jobs = await Job.find({
    status: { $nin: ["Cancelled", "Rejected", "Denied"] },
  });
  let fixed = 0;
  let skipped = 0;
  let failed = 0;

  for (const job of jobs) {
    if (hasRealCoordinates(job.location?.coordinates)) {
      skipped++;
      continue;
    }
    const address = job.location?.address;
    if (!address || address === "Address to be confirmed") {
      failed++;
      continue;
    }
    const coordinates = await geocodeAddress({ address });
    await sleep(200);
    if (coordinates) {
      job.location.coordinates = coordinates;
      await job.save();
      fixed++;
    } else {
      failed++;
      console.warn(
        `  ⚠️  Could not geocode job ${job._id} address: "${address}"`,
      );
    }
  }

  console.log(
    `Jobs: ${fixed} destination(s) geocoded, ${skipped} already had coordinates, ${failed} failed/skipped`,
  );
}

async function main() {
  if (!process.env.GOOGLE_MAPS_API_KEY && !process.env.GOOGLE_DIRECTIONS_API_KEY) {
    console.error(
      "GOOGLE_MAPS_API_KEY is not set in the backend environment — geocoding would fail for every record. Aborting.",
    );
    process.exit(1);
  }

  const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017/clickfix";
  await mongoose.connect(mongoUri);
  console.log("Connected to MongoDB\n");

  console.log("Backfilling customer addresses...");
  await backfillCustomers();

  console.log("\nBackfilling hardware shop locations...");
  await backfillShops();

  console.log("\nBackfilling job destinations...");
  await backfillJobs();

  await mongoose.disconnect();
  console.log("\nDone.");
}

main().catch((err) => {
  console.error("Backfill failed:", err);
  process.exit(1);
});
