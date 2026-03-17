const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
    },
    requestedWorkerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
    },
    serviceType: {
      type: String,
      required: [true, "Service type is required"],
      enum: [
        "Plumber",
        "Electrician",
        "Carpenter",
        "Cleaner",
        "AC Technician",
        "Painter",
        "Other",
      ],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
    },
    images: [String],
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
    },
    scheduledDate: {
      type: Date,
      required: true,
    },
    urgency: {
      type: String,
      enum: ["Normal", "Urgent", "Emergency"],
      default: "Normal",
    },
    status: {
      type: String,
      enum: [
        "Pending",
        "Accepted",
        "On the way",
        "In progress",
        "Completed",
        "Cancelled",
        "Rejected",
      ],
      default: "Pending",
    },
    pricing: {
      hourlyRate: Number,
      estimatedHours: { type: Number, default: 2 },
      serviceCharge: { type: Number, default: 0 },
      platformFee: { type: Number, default: 300 },
      hardwareCost: { type: Number, default: 0 },
      totalAmount: { type: Number, default: 0 },
    },
    hardwareItems: [
      {
        name: String,
        price: Number,
        quantity: { type: Number, default: 1 },
        status: {
          type: String,
          enum: ["suggested", "approved", "rejected"],
          default: "suggested",
        },
      },
    ],
    payment: {
      method: {
        type: String,
        enum: ["cash", "card", "wallet", "online"],
        default: "cash",
      },
      status: {
        type: String,
        enum: ["pending", "completed", "refunded"],
        default: "pending",
      },
      paidAt: Date,
      transactionId: String,
    },
    timeline: [
      {
        status: String,
        timestamp: { type: Date, default: Date.now },
        note: String,
      },
    ],
    estimatedDuration: {
      type: Number, // in minutes
      default: 120,
    },
    actualStartTime: Date,
    actualEndTime: Date,
    cancellationReason: String,
    rejectionReason: String,
  },
  {
    timestamps: true,
  },
);

// Index for geospatial queries
jobSchema.index({ location: "2dsphere" });

// Calculate total amount
jobSchema.pre("save", function (next) {
  if (this.pricing) {
    const serviceTotal =
      (this.pricing.hourlyRate || 0) * (this.pricing.estimatedHours || 2);
    this.pricing.totalAmount =
      serviceTotal +
      (this.pricing.platformFee || 0) +
      (this.pricing.hardwareCost || 0);
  }
  next();
});

module.exports = mongoose.model("Job", jobSchema);
