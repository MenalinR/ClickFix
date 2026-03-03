const mongoose = require("mongoose");

const hardwareItemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: ["Plumbing", "Electrical", "Carpentry", "General"],
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      default: "piece",
      enum: ["piece", "meter", "kg", "liter", "box"],
    },
    description: String,
    image: String,
    inStock: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

const hardwareRequestSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    items: [
      {
        hardwareId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "HardwareItem",
        },
        name: String,
        quantity: { type: Number, default: 1 },
        price: Number,
      },
    ],
    totalCost: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "delivered"],
      default: "pending",
    },
    customerNote: String,
    workerNote: String,
  },
  {
    timestamps: true,
  },
);

const HardwareItem = mongoose.model("HardwareItem", hardwareItemSchema);
const HardwareRequest = mongoose.model(
  "HardwareRequest",
  hardwareRequestSchema,
);

module.exports = { HardwareItem, HardwareRequest };
