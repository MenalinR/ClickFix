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
  workerCounter,
  finalizePrice,
  getWorkerBusySlots,
  uploadJobImage,
} = require("../controllers/jobController");
const { protect, authorize } = require("../middleware/auth");
const { uploadDocument } = require("../utils/upload");

const router = express.Router();

router.post("/", protect, authorize("customer"), createJob);
router.post(
  "/upload-image",
  protect,
  authorize("customer"),
  (req, res, next) => {
    req.uploadFolder = "job-images";
    next();
  },
  uploadDocument,
  uploadJobImage,
);
router.get("/", protect, getJobs);
router.get("/available", protect, authorize("worker"), getAvailableJobs);
router.get("/worker/:workerId/busy", protect, getWorkerBusySlots);
router.get("/:id", protect, getJob);
router.put("/:id/assign", protect, authorize("worker"), assignWorker);
router.put("/:id/customer-response", protect, authorize("customer"), customerRespond);
router.put("/:id/worker-counter", protect, authorize("worker"), workerCounter);
router.put("/:id/finalize-price", protect, finalizePrice);
router.put("/:id/status", protect, updateJobStatus);
router.put("/:id/cancel", protect, cancelJob);

module.exports = router;
