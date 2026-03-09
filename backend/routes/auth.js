const express = require("express");
const {
  registerWorker,
  registerCustomer,
  loginWorker,
  loginCustomer,
  loginAdmin,
  getMe,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.post("/worker/register", registerWorker);
router.post("/customer/register", registerCustomer);
router.post("/worker/login", loginWorker);
router.post("/customer/login", loginCustomer);
router.post("/admin/login", loginAdmin);
router.get("/me", protect, getMe);

module.exports = router;
