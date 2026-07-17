const mongoose = require("mongoose");

const complaintSchema = new mongoose.Schema(
  {
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
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      enum: [
        "Unprofessional Behavior",
        "No Show",
        "Property Damage",
        "Overcharging",
        "Fraud",
        "Poor Quality Work",
        "Other",
      ],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["pending", "reviewing", "resolved", "dismissed"],
      default: "pending",
    },
    adminNotes: {
      type: String,
      maxlength: 500,
    },
  },
  { timestamps: true },
);

complaintSchema.index({ customerId: 1, createdAt: -1 });
complaintSchema.index({ workerId: 1 });
complaintSchema.index({ status: 1 });

module.exports = mongoose.model("Complaint", complaintSchema);
