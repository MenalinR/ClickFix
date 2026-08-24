const express = require("express");
const {
  getPlatformSettings,
  updatePlatformSettings,
} = require("../controllers/settingsController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, authorize("admin"), getPlatformSettings);
router.put("/", protect, authorize("admin"), updatePlatformSettings);

module.exports = router;
