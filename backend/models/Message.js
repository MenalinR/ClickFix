const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: String,
      required: true,
      index: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "senderModel",
    },
    senderModel: {
      type: String,
      required: true,
      enum: ["Worker", "Customer"],
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "receiverModel",
    },
    receiverModel: {
      type: String,
      required: true,
      enum: ["Worker", "Customer"],
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
    },
    messageType: {
      type: String,
      enum: ["text", "image", "location", "quick-action"],
      default: "text",
    },
    content: {
      type: String,
      required: true,
    },
    imageUrl: String,
    location: {
      latitude: Number,
      longitude: Number,
    },
    quickAction: {
      type: String,
      enum: ["location", "eta", "parts", "status"],
    },
    status: {
      type: String,
      enum: ["sending", "sent", "delivered", "read"],
      default: "sent",
    },
    readAt: Date,
  },
  {
    timestamps: true,
  },
);

// Index for faster queries
messageSchema.index({ chatId: 1, createdAt: -1 });
messageSchema.index({ senderId: 1, receiverId: 1 });

module.exports = mongoose.model("Message", messageSchema);
