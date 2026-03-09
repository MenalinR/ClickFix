/**
 * Seed script to create an initial admin user
 * Run with: node backend/seed-admin.js
 */

const mongoose = require("mongoose");
const Admin = require("./models/Admin");

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/clickfix";

async function seedAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log("📦 Connected to MongoDB");

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: "admin@clickfix.com" });
    
    if (existingAdmin) {
      console.log("⚠️  Admin user already exists with email: admin@clickfix.com");
      console.log("Email:", existingAdmin.email);
      console.log("Name:", existingAdmin.name);
      console.log("Role:", existingAdmin.role);
      console.log("Active:", existingAdmin.isActive);
      await mongoose.disconnect();
      return;
    }

    // Create new admin
    const admin = new Admin({
      name: "System Admin",
      email: "admin@clickfix.com",
      password: "admin123", // Will be hashed by pre-save hook
      role: "admin",
      isActive: true,
    });

    await admin.save();

    console.log("✅ Admin user created successfully!");
    console.log("\n📧 Login Credentials:");
    console.log("Email: admin@clickfix.com");
    console.log("Password: admin123");
    console.log("\n⚠️  IMPORTANT: Change the password after first login!");

    await mongoose.disconnect();
    console.log("\n✅ Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error seeding admin:", error);
    process.exit(1);
  }
}

seedAdmin();
