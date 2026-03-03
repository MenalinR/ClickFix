const express = require("express");
const {
  getCustomer,
  updateCustomer,
  addAddress,
  addFavorite,
  removeFavorite,
  addWalletTransaction,
} = require("../controllers/customerController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/:id", protect, authorize("customer"), getCustomer);
router.put("/:id", protect, authorize("customer"), updateCustomer);
router.post("/:id/addresses", protect, authorize("customer"), addAddress);
router.post(
  "/:id/favorites/:workerId",
  protect,
  authorize("customer"),
  addFavorite,
);
router.delete(
  "/:id/favorites/:workerId",
  protect,
  authorize("customer"),
  removeFavorite,
);
router.post(
  "/:id/wallet",
  protect,
  authorize("customer"),
  addWalletTransaction,
);

module.exports = router;
