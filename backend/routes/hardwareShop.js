const express = require("express");
const {
  getItems,
  addItem,
  updateItem,
  deleteItem,
  getStats,
  getOrders,
} = require("../controllers/hardwareShopController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// All routes require hardwareShop authentication
router.use(protect, authorize("hardwareShop"));

// Items management
router.get("/items", getItems);
router.post("/items", addItem);
router.put("/items/:id", updateItem);
router.delete("/items/:id", deleteItem);

// Stats and orders
router.get("/stats", getStats);
router.get("/orders", getOrders);

module.exports = router;
