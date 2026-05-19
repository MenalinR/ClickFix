const express = require("express");
const {
  registerWorker,
  registerCustomer,
  loginWorker,
  loginCustomer,
  loginAdmin,
  registerHardwareShop,
  loginHardwareShop,
  getMe,
  updateAdminProfile,
  changeAdminPassword,
  updateAdminNotificationPreferences,
} = require("../controllers/authController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/worker/register", registerWorker);
router.post("/customer/register", registerCustomer);
router.post("/worker/login", loginWorker);
router.post("/customer/login", loginCustomer);
router.post("/admin/login", loginAdmin);
router.post("/hardwareShop/register", registerHardwareShop);
router.post("/hardwareShop/login", loginHardwareShop);
router.get("/me", protect, getMe);

// Admin self-service
router.put("/admin/profile", protect, authorize("admin"), updateAdminProfile);
router.put("/admin/password", protect, authorize("admin"), changeAdminPassword);
router.put(
  "/admin/notification-preferences",
  protect,
  authorize("admin"),
  updateAdminNotificationPreferences,
);

module.exports = router;
