const express = require("express");
const {
  getWorkers,
  getWorker,
  updateWorker,
  addCertificate,
  updateAvailability,
  uploadIDProof,
  uploadExperienceDocument,
  getVerificationStatus,
  verifyIDProof,
  verifyExperienceDocument,
  getPendingDocuments,
} = require("../controllers/workerController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", getWorkers);
router.get("/:id", getWorker);
router.get("/:id/verification-status", protect, getVerificationStatus);

// Admin routes for document verification
router.get(
  "/admin/pending",
  protect,
  authorize("admin"),
  getPendingDocuments,
);
router.put(
  "/:id/verify-id-proof",
  protect,
  authorize("admin"),
  verifyIDProof,
);
router.put(
  "/:id/verify-experience/:docId",
  protect,
  authorize("admin"),
  verifyExperienceDocument,
);

// Worker routes
router.put("/:id", protect, authorize("worker"), updateWorker);
router.post("/:id/certificates", protect, authorize("worker"), addCertificate);
router.put(
  "/:id/availability",
  protect,
  authorize("worker"),
  updateAvailability,
);
router.post("/:id/upload-id-proof", protect, authorize("worker"), uploadIDProof);
router.post(
  "/:id/upload-experience",
  protect,
  authorize("worker"),
  uploadExperienceDocument,
);

module.exports = router;
