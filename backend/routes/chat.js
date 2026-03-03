const express = require("express");
const {
  getMessages,
  sendMessage,
  updateMessageStatus,
  getChats,
  markChatAsRead,
} = require("../controllers/chatController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getChats);
router.get("/:chatId", protect, getMessages);
router.post("/", protect, sendMessage);
router.put("/:messageId/status", protect, updateMessageStatus);
router.put("/:chatId/read", protect, markChatAsRead);

module.exports = router;
