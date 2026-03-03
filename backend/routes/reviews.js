const express = require("express");
const {
  createReview,
  getWorkerReviews,
  getReview,
  respondToReview,
  markHelpful,
} = require("../controllers/reviewController");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

router.post("/", protect, authorize("customer"), createReview);
router.get("/worker/:workerId", getWorkerReviews);
router.get("/:id", getReview);
router.put("/:id/response", protect, authorize("worker"), respondToReview);
router.put("/:id/helpful", protect, markHelpful);

module.exports = router;
