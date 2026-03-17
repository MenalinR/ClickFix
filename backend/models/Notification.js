const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "recipientModel",
      required: true,
    },
    recipientModel: {
      type: String,
      required: true,
      enum: ["Worker", "Customer", "Admin"],
    },
    type: {
      type: String,
      required: true,
      enum: [
        "DOCUMENT_UPLOADED",
        "DOCUMENT_VERIFIED",
        "DOCUMENT_REJECTED",
        "JOB_ASSIGNED",
        "JOB_REQUESTED",
        "JOB_COMPLETED",
        "PAYMENT_RECEIVED",
        "REVIEW_RECEIVED",
        "HARDWARE_REQUEST",
        "GENERAL",
      ],
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    data: {
      workerId: String,
      workerName: String,
      documentType: String,
      jobId: String,
      customerId: String,
      // Additional metadata
      metadata: mongoose.Schema.Types.Mixed,
    },
    read: {
      type: Boolean,
      default: false,
    },
    readAt: Date,
    actionUrl: String, // Deep link or route to navigate to
  },
  {
    timestamps: true,
  },
);

// Index for efficient queries
notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ type: 1 });

module.exports = mongoose.model("Notification", notificationSchema);
