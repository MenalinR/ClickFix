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
      enum: ["text", "image", "location", "quick-action", "hardware-cart"],
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
    cartItems: [
      {
        name: { type: String, required: true },
        price: { type: Number, min: 0 },
        quantity: { type: Number, default: 1, min: 1 },
        status: {
          type: String,
          enum: ["suggested", "approved", "rejected"],
          default: "suggested",
        },
      },
    ],
    cartStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "ordered"],
      default: "pending",
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
