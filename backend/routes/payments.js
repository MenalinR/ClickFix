const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const {
  generatePayhereHash,
  payhereNotify,
} = require("../controllers/paymentController");

router.post("/payhere/hash", protect, generatePayhereHash);
router.post("/payhere/notify", payhereNotify); // No auth — called by PayHere servers

// PayHere redirects to these after payment — detected by WebView
router.get("/payment/return", (req, res) =>
  res.send("<html><body><h2>Payment successful</h2></body></html>"),
);
router.get("/payment/cancel", (req, res) =>
  res.send("<html><body><h2>Payment cancelled</h2></body></html>"),
);

module.exports = router;
