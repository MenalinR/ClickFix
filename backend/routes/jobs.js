const express = require("express");
const {
  createJob,
  getJobs,
  getAvailableJobs,
  getJob,
  assignWorker,
  updateJobStatus,
  cancelJob,
  customerRespond,
  finalizePrice,
} = require("../controllers/jobController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, authorize("customer"), createJob);
router.get("/", protect, getJobs);
router.get("/available", protect, authorize("worker"), getAvailableJobs);
router.get("/:id", protect, getJob);
router.put("/:id/assign", protect, authorize("worker"), assignWorker);
router.put("/:id/customer-response", protect, authorize("customer"), customerRespond);
router.put("/:id/finalize-price", protect, finalizePrice);
router.put("/:id/status", protect, updateJobStatus);
router.put("/:id/cancel", protect, cancelJob);

module.exports = router;
