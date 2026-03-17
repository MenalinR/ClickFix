const Job = require("../models/Job");
const Worker = require("../models/Worker");
const Customer = require("../models/Customer");
const { createNotification } = require("./notificationController");

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
      requestedWorkerId,
    } = req.body;

    // Get default hourly rate based on service type (matches Worker category enum)
    const hourlyRateMap = {
      Plumber: 45,
      Electrician: 50,
      Carpenter: 40,
      Cleaner: 30,
      "AC Technician": 55,
      Painter: 35,
      Other: 40,
    };

    const defaultLocation = {
      type: "Point",
      coordinates: [79.8612, 6.9271],
      address: "Address to be confirmed",
    };
    const defaultScheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const jobPayload = {
      customerId: req.user._id,
      serviceType,
      description,
      images: images || [],
      location: location && location.coordinates ? location : defaultLocation,
      scheduledDate: scheduledDate ? new Date(scheduledDate) : defaultScheduledDate,
      urgency: urgency || "Normal",
      pricing: {
        hourlyRate: hourlyRateMap[serviceType] || 40,
        estimatedHours: estimatedHours || 2,
        platformFee: 5,
      },
    };
    if (requestedWorkerId) {
      jobPayload.requestedWorkerId = requestedWorkerId;
    }

    const job = await Job.create(jobPayload);

    // Notify requested worker when customer chooses them
    if (requestedWorkerId) {
      try {
        const customer = await Customer.findById(req.user._id).select("name");
        const worker = await Worker.findById(requestedWorkerId).select("name");
        if (worker) {
          await createNotification({
            recipient: requestedWorkerId,
            recipientModel: "Worker",
            type: "JOB_REQUESTED",
            title: "New booking request",
            message: `${customer?.name || "A customer"} requested you for ${serviceType}: ${(description || "").slice(0, 60)}${description && description.length > 60 ? "…" : ""}`,
            data: {
              jobId: job._id.toString(),
              customerId: req.user._id.toString(),
              workerId: requestedWorkerId,
            },
            actionUrl: "/worker/job-requests",
          });
        }
      } catch (notifErr) {
        console.error("Error creating job request notification:", notifErr);
      }
    }

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
    // If worker, show jobs assigned to them or requested for them
    else if (req.userType === "worker") {
      query.$or = [
        { workerId: req.user._id },
        { requestedWorkerId: req.user._id },
      ];
    }

    const jobs = await Job.find(query)
      .populate("requestedWorkerId", "name phone category")
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
    const isRequestedForMe =
      job.requestedWorkerId &&
      job.requestedWorkerId.toString() === req.user._id.toString();

    if (!isRequestedForMe && worker.category !== job.serviceType) {
      return res.status(400).json({
        success: false,
        message: "Job category does not match your skills",
      });
    }

    if (job.requestedWorkerId && !isRequestedForMe) {
      return res.status(403).json({
        success: false,
        message: "This job was requested for another worker",
      });
    }

    job.workerId = req.user._id;
    job.status = "Accepted";
    job.pricing.hourlyRate = worker.hourlyRate || job.pricing.hourlyRate;
    job.timeline.push({
      status: "Accepted",
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

    // Check authorization: worker can update if assigned or if they are the requested worker (e.g. reject)
    if (req.userType === "worker") {
      const isAssigned = job.workerId && job.workerId.toString() === req.user._id.toString();
      const isRequested = job.requestedWorkerId && job.requestedWorkerId.toString() === req.user._id.toString();
      if (!isAssigned && !isRequested) {
        return res.status(403).json({
          success: false,
          message: "Not authorized",
        });
      }
      if (!isAssigned && isRequested && req.body.status !== "Rejected") {
        return res.status(400).json({
          success: false,
          message: "Accept this job via the assign endpoint first",
        });
      }
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
