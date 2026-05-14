const express = require("express");
const {
  getItems,
  addItem,
  updateItem,
  deleteItem,
  getStats,
  getOrders,
  listShops,
  uploadItemImage,
  uploadShopImage,
  markOrdersViewed,
  acceptOrder,
  rejectOrder,
  markPacking,
} = require("../controllers/hardwareShopController");
const { protect, authorize } = require("../middleware/auth");
const { uploadDocument } = require("../utils/upload");

const router = express.Router();

// Public list of shops (any authenticated user, e.g. worker picking a shop)
router.get("/list", protect, listShops);

// All other routes require hardwareShop authentication
router.use(protect, authorize("hardwareShop"));

// Profile image
router.post(
  "/upload-image",
  (req, res, next) => {
    req.uploadFolder = "shop-profiles";
    next();
  },
  uploadDocument,
  uploadShopImage,
);

// Items management
router.get("/items", getItems);
router.post("/items", addItem);
router.post(
  "/items/upload-image",
  (req, res, next) => {
    req.uploadFolder = "hardware";
    next();
  },
  uploadDocument,
  uploadItemImage,
);
router.put("/items/:id", updateItem);
router.delete("/items/:id", deleteItem);

// Stats and orders
router.get("/stats", getStats);
router.get("/orders", getOrders);
router.put("/orders/mark-viewed", markOrdersViewed);
router.put("/orders/:id/accept", acceptOrder);
router.put("/orders/:id/reject", rejectOrder);
router.put("/orders/:id/mark-packing", markPacking);

module.exports = router;
