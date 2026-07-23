const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  generatePayhereHash,
  payhereNotify,
} = require("../controllers/paymentController");

router.post("/payhere/hash", protect, generatePayhereHash);
router.post("/payhere/notify", payhereNotify); // No auth — called by PayHere servers

module.exports = router;
