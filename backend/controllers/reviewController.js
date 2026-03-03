const Review = require("../models/Review");
const Worker = require("../models/Worker");
const Job = require("../models/Job");

// @desc    Create review
// @route   POST /api/reviews
// @access  Private (Customer only)
exports.createReview = async (req, res) => {
  try {
    const {
      jobId,
      workerId,
      rating,
      aspectRatings,
      comment,
      beforeImages,
      afterImages,
      anonymous,
      wouldRecommend,
    } = req.body;

    // Check if job exists and belongs to customer
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (job.status !== "completed") {
      return res.status(400).json({
        success: false,
        message: "Can only review completed jobs",
      });
    }

    // Check if review already exists
    const existingReview = await Review.findOne({ jobId });
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "Review already exists for this job",
      });
    }

    const review = await Review.create({
      jobId,
      customerId: req.user._id,
      workerId,
      rating,
      aspectRatings,
      comment,
      beforeImages,
      afterImages,
      anonymous,
      wouldRecommend,
    });

    // Update worker rating
    const worker = await Worker.findById(workerId);
    await worker.updateRating();

    res.status(201).json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get reviews for a worker
// @route   GET /api/reviews/worker/:workerId
// @access  Public
exports.getWorkerReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ workerId: req.params.workerId })
      .populate("customerId", "name")
      .populate("jobId", "serviceType")
      .sort("-createdAt");

    // Calculate stats
    const stats = {
      totalReviews: reviews.length,
      averageRating: 0,
      aspectAverages: {
        professionalism: 0,
        quality: 0,
        punctuality: 0,
        communication: 0,
      },
      recommendationRate: 0,
    };

    if (reviews.length > 0) {
      stats.averageRating =
        reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      stats.aspectAverages.professionalism =
        reviews.reduce((sum, r) => sum + r.aspectRatings.professionalism, 0) /
        reviews.length;
      stats.aspectAverages.quality =
        reviews.reduce((sum, r) => sum + r.aspectRatings.quality, 0) /
        reviews.length;
      stats.aspectAverages.punctuality =
        reviews.reduce((sum, r) => sum + r.aspectRatings.punctuality, 0) /
        reviews.length;
      stats.aspectAverages.communication =
        reviews.reduce((sum, r) => sum + r.aspectRatings.communication, 0) /
        reviews.length;

      const recommendations = reviews.filter((r) => r.wouldRecommend).length;
      stats.recommendationRate = (recommendations / reviews.length) * 100;
    }

    res.status(200).json({
      success: true,
      count: reviews.length,
      stats,
      data: reviews,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single review
// @route   GET /api/reviews/:id
// @access  Public
exports.getReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate("customerId", "name")
      .populate("workerId", "name category")
      .populate("jobId", "serviceType");

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Worker response to review
// @route   PUT /api/reviews/:id/response
// @access  Private (Worker only)
exports.respondToReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    // Check if worker owns this review
    if (review.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    review.response = {
      comment: req.body.comment,
      respondedAt: new Date(),
    };

    await review.save();

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mark review as helpful
// @route   PUT /api/reviews/:id/helpful
// @access  Private
exports.markHelpful = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    review.helpful += 1;
    await review.save();

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
