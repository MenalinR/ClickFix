const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const workerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Phone is required"],
      unique: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    category: {
      type: String,
      required: [true, "Category is required"],
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
    experience: {
      type: Number,
      default: 0,
      min: 0,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    hourlyRate: {
      type: Number,
      required: [true, "Hourly rate is required"],
      min: 0,
    },
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
      address: String,
      city: String,
      district: String,
    },
    image: {
      type: String,
      default: "https://via.placeholder.com/150",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    nicVerified: {
      type: Boolean,
      default: false,
    },
    nicNumber: String,
    certificates: [
      {
        name: String,
        url: String,
        issueDate: Date,
      },
    ],
    skills: [String],
    availability: {
      type: String,
      enum: ["Available", "Busy", "Offline"],
      default: "Available",
    },
    completedJobs: {
      type: Number,
      default: 0,
    },
    earnings: {
      total: { type: Number, default: 0 },
      pending: { type: Number, default: 0 },
      withdrawn: { type: Number, default: 0 },
    },
    bankDetails: {
      accountNumber: String,
      accountName: String,
      bankName: String,
      branchCode: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastSeen: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  },
);

// Index for geospatial queries
workerSchema.index({ location: "2dsphere" });

// Hash password before saving
workerSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password method
workerSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update rating
workerSchema.methods.updateRating = function (newRating) {
  this.rating =
    (this.rating * this.reviewCount + newRating) / (this.reviewCount + 1);
  this.reviewCount += 1;
};

module.exports = mongoose.model("Worker", workerSchema);
