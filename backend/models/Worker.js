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
    bio: {
      type: String,
      default: "",
      trim: true,
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
      default: 0,
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
    // Document Verification Fields
    idProof: {
      url: String, // Secure URL to ID document (Cloudinary or similar)
      documentType: {
        type: String,
        enum: ["NIC", "Passport", "DrivingLicense", "Other"],
      },
      uploadedAt: Date,
      verificationStatus: {
        type: String,
        enum: ["Pending", "Verified", "Rejected"],
        default: "Pending",
      },
      verificationNotes: String, // Admin notes if rejected
      verifiedAt: Date, // When admin verified/rejected
    },
    experienceDocuments: [
      {
        title: String, // Experience title shown as heading
        name: String, // Certificate name
        description: String, // Worker-provided experience/proof description
        url: String, // Secure URL
        documentType: {
          type: String,
          enum: ["Certificate", "License", "Training", "Other"],
        },
        issueDate: Date,
        expiryDate: Date,
        uploadedAt: Date,
        verificationStatus: {
          type: String,
          enum: ["Pending", "Verified", "Rejected"],
          default: "Verified",
        },
        verificationNotes: String, // Admin notes if rejected
        verifiedAt: Date, // When admin verified/rejected
      },
    ],
    educationDocuments: [
      {
        name: String, // Degree/Education name
        institution: String, // School/University name
        description: String, // Education details
        url: String, // Secure URL to certificate/diploma
        documentType: {
          type: String,
          enum: ["Degree", "Diploma", "Certificate", "Other"],
        },
        startDate: Date,
        endDate: Date,
        uploadedAt: Date,
        verificationStatus: {
          type: String,
          enum: ["Pending", "Verified", "Rejected"],
          default: "Verified",
        },
        verificationNotes: String,
        verifiedAt: Date,
      },
    ],
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
