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
      .populate("customerId", "name phone addresses")
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
      .populate("customerId", "name phone addresses")
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

    const { price } = req.body || {};
    const priceNum = Number(price);
    if (price == null || isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid price is required to accept a job",
      });
    }

    job.workerId = req.user._id;
    job.status = "Worker Accepted";
    job.pricing.hourlyRate = worker.hourlyRate || job.pricing.hourlyRate;
    job.pricing.proposedPrice = priceNum;
    job.pricing.serviceCharge = priceNum;
    job.pricing.totalAmount = priceNum;
    job.timeline.push({
      status: "Worker Accepted",
      timestamp: new Date(),
      note: `Worker proposed price: ${priceNum} LKR`,
    });

    await job.save();

    // Notify customer that worker accepted with a proposed price
    try {
      await createNotification({
        recipient: job.customerId,
        recipientModel: "Customer",
        type: "JOB_ASSIGNED",
        title: "Worker proposed a price",
        message: `Worker proposed ${priceNum} LKR for your ${job.serviceType} request. Review now.`,
        data: { jobId: job._id, workerId: req.user._id },
        actionUrl: "/(customer)/(tabs)/",
      });
    } catch (e) {
      // non-fatal
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

// @desc    Customer responds to worker's proposed price (approve/negotiate/deny)
// @route   PUT /api/jobs/:id/customer-response
// @access  Private (Customer only)
exports.customerRespond = async (req, res) => {
  try {
    const { action, price } = req.body || {};
    const validActions = ["approve", "negotiate", "deny"];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: "Invalid action. Must be approve, negotiate, or deny.",
      });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    if (job.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (job.status !== "Worker Accepted" && action !== "deny") {
      return res.status(400).json({
        success: false,
        message: "Job is not awaiting customer review",
      });
    }

    if (action === "approve") {
      job.status = "Accepted";
      job.timeline.push({
        status: "Accepted",
        timestamp: new Date(),
        note: "Customer approved proposed price",
      });
    } else if (action === "negotiate") {
      job.status = "Negotiating";
      const priceNum = Number(price);
      if (!isNaN(priceNum) && priceNum > 0) {
        job.pricing.negotiatedPrice = priceNum;
      }
      job.timeline.push({
        status: "Negotiating",
        timestamp: new Date(),
        note:
          !isNaN(priceNum) && priceNum > 0
            ? `Customer proposed counter price: ${priceNum} LKR`
            : "Customer initiated negotiation",
      });
    } else if (action === "deny") {
      job.status = "Denied";
      job.timeline.push({
        status: "Denied",
        timestamp: new Date(),
        note: "Customer denied proposed price",
      });
    }

    await job.save();

    // Notify the worker about the customer's decision
    if (job.workerId) {
      const notifyMap = {
        approve: {
          title: "Customer approved your price",
          message: `Customer approved your proposed price for the ${job.serviceType} job.`,
        },
        negotiate: {
          title: "Customer wants to negotiate",
          message: `Customer wants to negotiate on your ${job.serviceType} job.`,
        },
        deny: {
          title: "Customer denied your price",
          message: `Customer denied your proposed price for the ${job.serviceType} job.`,
        },
      };
      try {
        await createNotification({
          recipient: job.workerId,
          recipientModel: "Worker",
          type: "JOB_ASSIGNED",
          title: notifyMap[action].title,
          message: notifyMap[action].message,
          data: { jobId: job._id, customerId: job.customerId },
          actionUrl: "/job-requests",
        });
      } catch (e) {
        // non-fatal
      }
    }

    res.status(200).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Finalize agreed price (called from chat negotiation when both sides agree)
// @route   PUT /api/jobs/:id/finalize-price
// @access  Private
exports.finalizePrice = async (req, res) => {
  try {
    const { price } = req.body || {};
    const priceNum = Number(price);
    if (isNaN(priceNum) || priceNum <= 0) {
      return res.status(400).json({
        success: false,
        message: "A valid price is required",
      });
    }

    const job = await Job.findById(req.params.id);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }

    const isCustomer =
      req.userType === "customer" &&
      job.customerId.toString() === req.user._id.toString();
    const isWorker =
      req.userType === "worker" &&
      job.workerId &&
      job.workerId.toString() === req.user._id.toString();

    if (!isCustomer && !isWorker) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    if (job.status !== "Negotiating" && job.status !== "Worker Accepted") {
      return res.status(400).json({
        success: false,
        message: "Job is not in a negotiable state",
      });
    }

    job.status = "Accepted";
    job.pricing.serviceCharge = priceNum;
    job.pricing.totalAmount = priceNum;
    job.pricing.negotiatedPrice = priceNum;
    job.timeline.push({
      status: "Accepted",
      timestamp: new Date(),
      note: `Final agreed price: ${priceNum} LKR`,
    });

    await job.save();

    // Notify the other party
    const recipient = isCustomer ? job.workerId : job.customerId;
    const recipientModel = isCustomer ? "Worker" : "Customer";
    if (recipient) {
      try {
        await createNotification({
          recipient,
          recipientModel,
          type: "JOB_ASSIGNED",
          title: "Price agreed",
          message: `Final price of ${priceNum} LKR has been agreed for the ${job.serviceType} job.`,
          data: { jobId: job._id },
          actionUrl:
            recipientModel === "Worker"
              ? "/job-requests"
              : "/(customer)/(tabs)/bookings",
        });
      } catch (e) {
        // non-fatal
      }
    }

    res.status(200).json({ success: true, data: job });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
