const Job = require("../models/Job");
const Worker = require("../models/Worker");
const Customer = require("../models/Customer");

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Customer only)
exports.createJob = async (req, res) => {
  try {
    const {
      serviceType,
      description,
      images,
      location,
      scheduledDate,
      urgency,
      estimatedHours,
    } = req.body;

    // Get default hourly rate based on service type (you can adjust these)
    const hourlyRateMap = {
      Electrician: 50,
      Plumber: 45,
      Carpenter: 40,
      Painter: 35,
      "AC Repair": 55,
      "Appliance Repair": 45,
      "General Handyman": 30,
    };

    const job = await Job.create({
      customerId: req.user._id,
      serviceType,
      description,
      images,
      location,
      scheduledDate,
      urgency,
      pricing: {
        hourlyRate: hourlyRateMap[serviceType] || 40,
        estimatedHours: estimatedHours || 2,
        platformFee: 5,
      },
    });

    res.status(201).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all jobs (filtered by role)
// @route   GET /api/jobs
// @access  Private
exports.getJobs = async (req, res) => {
  try {
    let query = {};

    // If customer, show only their jobs
    if (req.userType === "customer") {
      query.customerId = req.user._id;
    }
    // If worker, show jobs assigned to them
    else if (req.userType === "worker") {
      query.workerId = req.user._id;
    }

    const jobs = await Job.find(query)
      .populate("customerId", "name phone")
      .populate("workerId", "name phone category rating")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get available jobs for workers
// @route   GET /api/jobs/available
// @access  Private (Worker only)
exports.getAvailableJobs = async (req, res) => {
  try {
    const worker = await Worker.findById(req.user._id);

    let query = {
      status: "pending",
      serviceType: worker.category,
    };

    // If worker has location, find nearby jobs
    if (worker.location && worker.location.coordinates) {
      const maxDistance = req.query.maxDistance || 50000; // 50km default

      query.location = {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: worker.location.coordinates,
          },
          $maxDistance: parseInt(maxDistance),
        },
      };
    }

    const jobs = await Job.find(query)
      .populate("customerId", "name phone")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Private
exports.getJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate("customerId", "name phone email")
      .populate("workerId", "name phone email category rating hourlyRate");

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check authorization
    if (
      req.userType === "customer" &&
      job.customerId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (
      req.userType === "worker" &&
      job.workerId &&
      job.workerId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Assign worker to job (worker accepts job)
// @route   PUT /api/jobs/:id/assign
// @access  Private (Worker only)
exports.assignWorker = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.workerId) {
      return res.status(400).json({
        success: false,
        message: "Job already assigned",
      });
    }

    const worker = await Worker.findById(req.user._id);

    if (worker.category !== job.serviceType) {
      return res.status(400).json({
        success: false,
        message: "Job category does not match your skills",
      });
    }

    job.workerId = req.user._id;
    job.status = "accepted";
    job.pricing.hourlyRate = worker.hourlyRate;
    job.timeline.push({
      status: "accepted",
      timestamp: new Date(),
    });

    await job.save();

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update job status
// @route   PUT /api/jobs/:id/status
// @access  Private
exports.updateJobStatus = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Check authorization
    if (
      req.userType === "worker" &&
      job.workerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    job.status = req.body.status;
    job.timeline.push({
      status: req.body.status,
      timestamp: new Date(),
      note: req.body.note,
    });

    // If completed, update worker's earnings
    if (req.body.status === "completed" && req.userType === "worker") {
      const worker = await Worker.findById(job.workerId);
      worker.earnings.totalEarned += job.pricing.totalAmount;
      worker.earnings.completedJobs += 1;
      await worker.save();
    }

    await job.save();

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Cancel job
// @route   PUT /api/jobs/:id/cancel
// @access  Private
exports.cancelJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    // Only customer or worker assigned to job can cancel
    if (
      req.userType === "customer" &&
      job.customerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (
      req.userType === "worker" &&
      job.workerId &&
      job.workerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    job.status = "cancelled";
    job.timeline.push({
      status: "cancelled",
      timestamp: new Date(),
      note: req.body.reason,
    });

    await job.save();

    res.status(200).json({
      success: true,
      data: job,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
