const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Worker = require("./models/Worker");
const Customer = require("./models/Customer");

// Load environment variables
dotenv.config();

const seedUsers = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(
      process.env.MONGODB_URI || "mongodb://localhost:27017/clickfix",
    );
    console.log("✅ MongoDB Connected");

    // Test Worker Data
    const testWorker = {
      name: "John Doe",
      email: "john@test.com",
      phone: "1234567890",
      password: "password123",
      category: "Plumber",
      hourlyRate: 1500,
      experience: 10, // Years as a number
      verified: true,
    };

    // Test Customer Data
    const testCustomer = {
      name: "Jane Customer",
      email: "customer@test.com",
      phone: "0987654321",
      password: "password123",
    };

    // Check if test worker already exists
    let worker = await Worker.findOne({ email: "john@test.com" });
    if (worker) {
      console.log("⚠️  Test worker already exists, updating...");
      // Update password
      worker.password = testWorker.password;
      await worker.save();
    } else {
      worker = await Worker.create(testWorker);
      console.log("✅ Test worker created:", worker.email);
    }

    // Check if test customer already exists
    let customer = await Customer.findOne({ email: "customer@test.com" });
    if (customer) {
      console.log("⚠️  Test customer already exists, updating...");
      // Update password
      customer.password = testCustomer.password;
      await customer.save();
    } else {
      customer = await Customer.create(testCustomer);
      console.log("✅ Test customer created:", customer.email);
    }

    console.log("\n✨ Test users seeded successfully!");
    console.log("\n📝 Test Credentials:");
    console.log("  Worker:   john@test.com / password123");
    console.log("  Customer: customer@test.com / password123");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding users:", error.message);
    process.exit(1);
  }
};

seedUsers();
