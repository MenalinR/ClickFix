const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// MongoDB Connection Function
const connectDB = async () => {
  try {
    const mongoUri =
      process.env.MONGODB_URI || "mongodb://localhost:27017/clickfix";

    const conn = await mongoose.connect(mongoUri);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📦 Database: ${conn.connection.name}`);

    // Return connection instance
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    // If MongoDB Atlas connection fails, try local MongoDB
    console.log("⚠️  Attempting to connect to local MongoDB...");

    try {
      const localConn = await mongoose.connect(
        "mongodb://localhost:27017/clickfix",
      );

      console.log(
        `✅ Connected to Local MongoDB: ${localConn.connection.host}`,
      );
      console.log(`📦 Database: ${localConn.connection.name}`);
      return localConn;
    } catch (localError) {
      console.error(`❌ Local MongoDB Connection Error: ${localError.message}`);
      console.error(
        "Please ensure MongoDB is running or set MONGODB_URI in .env",
      );
      process.exit(1);
    }
  }
};

// Initialize Collections/Indexes
const initializeDatabase = async () => {
  try {
    const db = mongoose.connection.db;

    // Get list of existing collections
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map((col) => col.name);

    console.log(
      "\n📊 Existing Collections:",
      collectionNames.length > 0 ? collectionNames.join(", ") : "None",
    );

    // Create collections if they don't exist
    const requiredCollections = [
      "workers",
      "customers",
      "jobs",
      "messages",
      "reviews",
      "hardwareitems",
      "hardwarerequests",
    ];

    for (const collection of requiredCollections) {
      if (!collectionNames.includes(collection)) {
        await db.createCollection(collection);
        console.log(`✅ Created collection: ${collection}`);
      }
    }

    console.log("\n✨ Database initialization completed!");
  } catch (error) {
    console.error("❌ Database initialization error:", error.message);
  }
};

// Check Database Connection Status
const checkDatabaseHealth = async () => {
  try {
    const admin = mongoose.connection.getClient().db("admin");
    const status = await admin.command({ ping: 1 });

    if (status.ok) {
      console.log("✅ Database Health: OK");
      return true;
    }
  } catch (error) {
    console.error("❌ Database Health Check Failed:", error.message);
    return false;
  }
};

// Disconnect Database
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("✅ MongoDB Disconnected");
  } catch (error) {
    console.error("❌ Disconnect error:", error.message);
  }
};

// Export functions
module.exports = {
  connectDB,
  initializeDatabase,
  checkDatabaseHealth,
  disconnectDB,
  mongoose,
};
