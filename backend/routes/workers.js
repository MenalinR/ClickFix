const express = require("express");
const {
  getWorkers,
  getWorker,
  updateWorker,
  addCertificate,
  updateAvailability,
} = require("../controllers/workerController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.get("/", getWorkers);
router.get("/:id", getWorker);
router.put("/:id", protect, authorize("worker"), updateWorker);
router.post("/:id/certificates", protect, authorize("worker"), addCertificate);
router.put(
  "/:id/availability",
  protect,
  authorize("worker"),
  updateAvailability,
);

module.exports = router;
