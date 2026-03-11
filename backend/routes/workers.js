const express = require("express");
const {
  getWorkers,
  getWorker,
  updateWorker,
  addCertificate,
  updateAvailability,
  uploadIDProof,
  uploadExperienceDocument,
  uploadEducationDocument,
  deleteExperienceDocument,
  deleteEducationDocument,
  uploadProfileImage,
  getVerificationStatus,
  verifyIDProof,
  verifyExperienceDocument,
  getPendingDocuments,
} = require("../controllers/workerController");
const { protect, authorize } = require("../middleware/auth");
const { uploadDocument } = require("../utils/upload");

const router = express.Router();

router.get("/", getWorkers);
router.get("/:id", getWorker);
router.get("/:id/verification-status", protect, getVerificationStatus);

// Admin routes for document verification
router.get("/admin/pending", protect, authorize("admin"), getPendingDocuments);
router.put("/:id/verify-id-proof", protect, authorize("admin"), verifyIDProof);
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
router.post(
  "/:id/upload-id-proof",
  protect,
  authorize("worker"),
  (req, res, next) => {
    req.uploadFolder = "id-proofs";
    next();
  },
  uploadDocument,
  uploadIDProof,
);
router.post(
  "/:id/upload-experience",
  protect,
  authorize("worker"),
  (req, res, next) => {
    req.uploadFolder = "experience-docs";
    next();
  },
  uploadDocument,
  uploadExperienceDocument,
);
router.post(
  "/:id/upload-education",
  protect,
  authorize("worker"),
  (req, res, next) => {
    req.uploadFolder = "education-docs";
    next();
  },
  uploadDocument,
  uploadEducationDocument,
);
router.delete(
  "/:id/experience/:docId",
  protect,
  authorize("worker"),
  deleteExperienceDocument,
);
router.delete(
  "/:id/education/:docId",
  protect,
  authorize("worker"),
  deleteEducationDocument,
);
router.post(
  "/:id/upload-image",
  protect,
  authorize("worker"),
  (req, res, next) => {
    req.uploadFolder = "profile-images";
    next();
  },
  uploadDocument,
  uploadProfileImage,
);

module.exports = router;
