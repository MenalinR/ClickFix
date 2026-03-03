const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    workerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Worker",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating is required"],
      min: 1,
      max: 5,
    },
    aspectRatings: {
      professionalism: { type: Number, min: 1, max: 5 },
      quality: { type: Number, min: 1, max: 5 },
      punctuality: { type: Number, min: 1, max: 5 },
      communication: { type: Number, min: 1, max: 5 },
    },
    comment: {
      type: String,
      maxlength: 500,
    },
    images: {
      before: String,
      after: String,
    },
    anonymous: {
      type: Boolean,
      default: false,
    },
    wouldRecommend: {
      type: Boolean,
      default: true,
    },
    response: {
      text: String,
      respondedAt: Date,
    },
    helpful: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

// Index for queries
reviewSchema.index({ workerId: 1, createdAt: -1 });
reviewSchema.index({ jobId: 1 });

module.exports = mongoose.model("Review", reviewSchema);
