const Message = require("../models/Message");

// @desc    Get messages for a chat
// @route   GET /api/chat/:chatId
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId })
      .populate("senderId", "name")
      .populate("receiverId", "name")
      .sort("createdAt");

    res.status(200).json({
      success: true,
      count: messages.length,
      data: messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Send a message
// @route   POST /api/chat
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { chatId, receiverId, receiverModel, jobId, messageType, content } =
      req.body;

    const message = await Message.create({
      chatId,
      senderId: req.user._id,
      senderModel: req.userType === "worker" ? "Worker" : "Customer",
      receiverId,
      receiverModel,
      jobId,
      messageType,
      content,
      status: "sent",
    });

    // Populate sender and receiver info
    await message.populate("senderId", "name");
    await message.populate("receiverId", "name");

    res.status(201).json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update message status (delivered/read)
// @route   PUT /api/chat/:messageId/status
// @access  Private
exports.updateMessageStatus = async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Only receiver can update status
    if (message.receiverId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    message.status = req.body.status;
    if (req.body.status === "read") {
      message.readAt = new Date();
    }

    await message.save();

    res.status(200).json({
      success: true,
      data: message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all chats for a user
// @route   GET /api/chat
// @access  Private
exports.getChats = async (req, res) => {
  try {
    // Find all unique chat IDs where user is sender or receiver
    const messages = await Message.find({
      $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
    })
      .populate("senderId", "name")
      .populate("receiverId", "name")
      .populate("jobId", "serviceType status")
      .sort("-createdAt");

    // Group by chatId and get last message
    const chats = {};
    messages.forEach((message) => {
      if (!chats[message.chatId]) {
        chats[message.chatId] = {
          chatId: message.chatId,
          lastMessage: message,
          otherUser:
            message.senderId._id.toString() === req.user._id.toString()
              ? message.receiverId
              : message.senderId,
          job: message.jobId,
          unreadCount: 0,
        };
      }

      // Count unread messages
      if (
        message.receiverId._id.toString() === req.user._id.toString() &&
        message.status !== "read"
      ) {
        chats[message.chatId].unreadCount++;
      }
    });

    res.status(200).json({
      success: true,
      data: Object.values(chats),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mark all messages in a chat as read
// @route   PUT /api/chat/:chatId/read
// @access  Private
exports.markChatAsRead = async (req, res) => {
  try {
    await Message.updateMany(
      {
        chatId: req.params.chatId,
        receiverId: req.user._id,
        status: { $ne: "read" },
      },
      {
        status: "read",
        readAt: new Date(),
      },
    );

    res.status(200).json({
      success: true,
      message: "Chat marked as read",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
