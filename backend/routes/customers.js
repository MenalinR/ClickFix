const express = require("express");
const {
  getAllCustomers,
  getCustomer,
  updateCustomer,
  addAddress,
  addFavorite,
  removeFavorite,
  addWalletTransaction,
  uploadProfileImage,
} = require("../controllers/customerController");
const { protect, authorize } = require("../middleware/auth");
const { uploadDocument } = require("../utils/upload");

const router = express.Router();

router.get("/", protect, authorize("admin"), getAllCustomers);
router.get("/:id", protect, authorize("customer"), getCustomer);
router.put("/:id", protect, authorize("customer"), updateCustomer);
router.post("/:id/addresses", protect, authorize("customer"), addAddress);
router.post(
  "/:id/upload-image",
  protect,
  authorize("customer"),
  (req, res, next) => {
    req.uploadFolder = "profile-images";
    next();
  },
  uploadDocument,
  uploadProfileImage,
);
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
