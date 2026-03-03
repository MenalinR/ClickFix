const express = require("express");
const {
  getHardwareItems,
  getHardwareItem,
  createHardwareRequest,
  getHardwareRequests,
  getHardwareRequest,
  updateRequestStatus,
  markAsDelivered,
  getAdminHardwareItems,
  createHardwareItem,
  updateHardwareItem,
  deleteHardwareItem,
  updateHardwareStock,
  getAdminHardwareRequests,
} = require("../controllers/hardwareController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// Hardware Items - Public (in-stock only)
router.get("/items", getHardwareItems);
router.get("/items/:id", getHardwareItem);

// Hardware Requests
router.post("/requests", protect, authorize("worker"), createHardwareRequest);
router.get("/requests", protect, getHardwareRequests);
router.get("/requests/:id", protect, getHardwareRequest);
router.put(
  "/requests/:id/status",
  protect,
  authorize("customer"),
  updateRequestStatus,
);
router.put(
  "/requests/:id/delivered",
  protect,
  authorize("worker"),
  markAsDelivered,
);

// ADMIN ROUTES - Hardware Management
router.get("/admin/items", protect, authorize("admin"), getAdminHardwareItems);
router.post("/admin/items", protect, authorize("admin"), createHardwareItem);
router.put("/admin/items/:id", protect, authorize("admin"), updateHardwareItem);
router.delete(
  "/admin/items/:id",
  protect,
  authorize("admin"),
  deleteHardwareItem,
);
router.put(
  "/admin/items/:id/stock",
  protect,
  authorize("admin"),
  updateHardwareStock,
);
router.get(
  "/admin/requests",
  protect,
  authorize("admin"),
  getAdminHardwareRequests,
);

module.exports = router;
