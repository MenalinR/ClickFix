const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/clickfix",
    );
    console.log("✅ Connected to MongoDB\n");
    return true;
  } catch (error) {
    console.error("❌ Connection error:", error.message);
    return false;
  }
};

// Show all collections and their document counts
const showCollections = async () => {
  try {
    console.log("📊 ClickFix Database Collections:\n");

    const db = mongoose.connection.getClient().db("clickfix");
    const collections = await db.listCollections().toArray();

    if (collections.length === 0) {
      console.log("  No collections found. Run: npm run seed\n");
      return;
    }

    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  📦 ${collection.name.toUpperCase()}`);
      console.log(`     └─ Documents: ${count}\n`);
    }
  } catch (error) {
    console.error("Error:", error.message);
  }
};

// Show detailed schema for each collection
const showSchemas = async () => {
  try {
    console.log("\n📋 Database Schemas:\n");

    const Worker = require("./models/Worker");
    const Customer = require("./models/Customer");
    const Job = require("./models/Job");
    const Message = require("./models/Message");
    const Review = require("./models/Review");
    const { HardwareItem, HardwareRequest } = require("./models/Hardware");

    console.log("1️⃣  WORKERS");
    console.log("   Fields:", Object.keys(Worker.schema.paths).join(", "));
    console.log("   Sample:", (await Worker.findOne()) || "No records");

    console.log("\n2️⃣  CUSTOMERS");
    console.log("   Fields:", Object.keys(Customer.schema.paths).join(", "));
    console.log("   Sample:", (await Customer.findOne()) || "No records");

    console.log("\n3️⃣  JOBS");
    console.log("   Fields:", Object.keys(Job.schema.paths).join(", "));
    console.log("   Sample:", (await Job.findOne()) || "No records");

    console.log("\n4️⃣  MESSAGES");
    console.log("   Fields:", Object.keys(Message.schema.paths).join(", "));
    console.log("   Sample:", (await Message.findOne()) || "No records");

    console.log("\n5️⃣  REVIEWS");
    console.log("   Fields:", Object.keys(Review.schema.paths).join(", "));
    console.log("   Sample:", (await Review.findOne()) || "No records");

    console.log("\n6️⃣  HARDWARE ITEMS");
    console.log(
      "   Fields:",
      Object.keys(HardwareItem.schema.paths).join(", "),
    );
    console.log("   Count:", await HardwareItem.countDocuments());

    console.log("\n7️⃣  HARDWARE REQUESTS");
    console.log(
      "   Fields:",
      Object.keys(HardwareRequest.schema.paths).join(", "),
    );
    console.log(
      "   Sample:",
      (await HardwareRequest.findOne()) || "No records",
    );
  } catch (error) {
    console.error("Error:", error.message);
  }
};

// Show sample data
const showSampleData = async () => {
  try {
    console.log("\n📄 Sample Data from Collections:\n");

    const Worker = require("./models/Worker");
    const Job = require("./models/Job");
    const Review = require("./models/Review");
    const { HardwareItem } = require("./models/Hardware");

    // Workers
    const workers = await Worker.find().limit(2);
    console.log("WORKERS Sample:");
    console.log(JSON.stringify(workers, null, 2));

    // Jobs
    const jobs = await Job.find().limit(2);
    console.log("\nJOBS Sample:");
    console.log(JSON.stringify(jobs, null, 2));

    // Hardware Items
    const hardware = await HardwareItem.find().limit(3);
    console.log("\nHARDWARE ITEMS Sample:");
    console.log(JSON.stringify(hardware, null, 2));
  } catch (error) {
    console.error("Error:", error.message);
  }
};

// Menu
const showMenu = () => {
  console.log("\n═══════════════════════════════════════");
  console.log("  ClickFix Database Manager");
  console.log("═══════════════════════════════════════\n");
  console.log("Commands:");
  console.log("  node showdb.js collections  - Show all collections");
  console.log("  node showdb.js schemas      - Show database schemas");
  console.log("  node showdb.js sample       - Show sample data");
  console.log("  node showdb.js all          - Show everything");
  console.log("\nExample: node showdb.js collections\n");
};

// Main execution
const command = process.argv[2];

(async () => {
  const connected = await connectDB();
  if (!connected) {
    process.exit(1);
  }

  switch (command) {
    case "collections":
      await showCollections();
      break;
    case "schemas":
      await showSchemas();
      break;
    case "sample":
      await showSampleData();
      break;
    case "all":
      await showCollections();
      await showSchemas();
      await showSampleData();
      break;
    default:
      showMenu();
  }

  mongoose.connection.close();
  process.exit(0);
})();
