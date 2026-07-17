const express = require("express");
const {
  createComplaint,
  getComplaints,
  updateComplaint,
} = require("../controllers/complaintController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, authorize("customer"), createComplaint);
router.get("/", protect, authorize("customer", "admin"), getComplaints);
router.put("/:id", protect, authorize("admin"), updateComplaint);

module.exports = router;
