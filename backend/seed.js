const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { HardwareItem } = require("./models/Hardware");

// Load environment variables
dotenv.config();

// Sample hardware items data
const hardwareItems = [
  // Electrical
  {
    name: "Copper Wire (2.5mm)",
    category: "Electrical",
    price: 5.99,
    unit: "meter",
    inStock: true,
  },
  {
    name: "MCB Circuit Breaker",
    category: "Electrical",
    price: 12.5,
    unit: "piece",
    inStock: true,
  },
  {
    name: "LED Bulb 9W",
    category: "Electrical",
    price: 3.99,
    unit: "piece",
    inStock: true,
  },
  {
    name: "Socket Box",
    category: "Electrical",
    price: 2.5,
    unit: "piece",
    inStock: true,
  },
  {
    name: "PVC Conduit Pipe",
    category: "Electrical",
    price: 4.25,
    unit: "meter",
    inStock: true,
  },

  // Plumbing
  {
    name: "PVC Pipe (1 inch)",
    category: "Plumbing",
    price: 3.5,
    unit: "meter",
    inStock: true,
  },
  {
    name: "Elbow Joint",
    category: "Plumbing",
    price: 1.5,
    unit: "piece",
    inStock: true,
  },
  {
    name: "Faucet/Tap",
    category: "Plumbing",
    price: 18.99,
    unit: "piece",
    inStock: true,
  },
  {
    name: "PVC Glue",
    category: "Plumbing",
    price: 6.5,
    unit: "piece",
    inStock: true,
  },
  {
    name: "Shower Head",
    category: "Plumbing",
    price: 25.0,
    unit: "piece",
    inStock: true,
  },

  // Carpentry
  {
    name: "Plywood Sheet (4x8)",
    category: "Carpentry",
    price: 45.0,
    unit: "piece",
    inStock: true,
  },
  {
    name: "Wood Screws Box",
    category: "Carpentry",
    price: 8.99,
    unit: "box",
    inStock: true,
  },
  {
    name: "Wood Glue",
    category: "Carpentry",
    price: 7.5,
    unit: "piece",
    inStock: true,
  },
  {
    name: "Sandpaper Assorted",
    category: "Carpentry",
    price: 5.25,
    unit: "box",
    inStock: true,
  },
  {
    name: "Door Hinge",
    category: "Carpentry",
    price: 4.99,
    unit: "piece",
    inStock: true,
  },

  // General
  {
    name: "Paint Brush Set",
    category: "General",
    price: 12.5,
    unit: "piece",
    inStock: true,
  },
  {
    name: "Paint Roller with Tray",
    category: "General",
    price: 9.99,
    unit: "piece",
    inStock: true,
  },
  {
    name: "Masking Tape",
    category: "General",
    price: 3.5,
    unit: "piece",
    inStock: true,
  },
  {
    name: "Screwdriver Set",
    category: "General",
    price: 15.99,
    unit: "piece",
    inStock: true,
  },
  {
    name: "Adjustable Wrench",
    category: "General",
    price: 11.5,
    unit: "piece",
    inStock: true,
  },
  {
    name: "Measuring Tape",
    category: "General",
    price: 6.99,
    unit: "piece",
    inStock: true,
  },
  {
    name: "Hammer",
    category: "General",
    price: 13.25,
    unit: "piece",
    inStock: true,
  },
  {
    name: "Drill Bit Set",
    category: "General",
    price: 22.99,
    unit: "piece",
    inStock: true,
  },
  {
    name: "Safety Gloves",
    category: "General",
    price: 4.5,
    unit: "piece",
    inStock: true,
  },
  {
    name: "Safety Goggles",
    category: "General",
    price: 7.99,
    unit: "piece",
    inStock: true,
  },
  {
    name: "Dust Mask (Pack of 10)",
    category: "General",
    price: 8.99,
    unit: "box",
    inStock: true,
  },
  {
    name: "Hard Hat",
    category: "General",
    price: 12.99,
    unit: "piece",
    inStock: true,
  },
  {
    name: "First Aid Kit",
    category: "General",
    price: 18.5,
    unit: "piece",
    inStock: true,
  },
];

// Connect to MongoDB and seed data
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log("✅ MongoDB Connected");

    // Clear existing hardware items
    await HardwareItem.deleteMany({});
    console.log("🗑️  Cleared existing hardware items");

    // Insert new hardware items
    await HardwareItem.insertMany(hardwareItems);
    console.log(
      `✅ Successfully seeded ${hardwareItems.length} hardware items`,
    );

    // Display sample items
    console.log("\n📦 Sample Hardware Items:");
    const samples = await HardwareItem.find().limit(5);
    samples.forEach((item) => {
      console.log(
        `  - ${item.name}: $${item.price}/${item.unit} (${item.category})`,
      );
    });

    console.log("\n✨ Database seeding completed!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Error:", err.message);
    process.exit(1);
  });
