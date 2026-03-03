const Worker = require("../models/Worker");

// @desc    Get all workers
// @route   GET /api/workers
// @access  Public
exports.getWorkers = async (req, res) => {
  try {
    const {
      category,
      latitude,
      longitude,
      maxDistance = 50000,
      minRating,
    } = req.query;

    let query = { availability: "available" };

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by rating
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    let workers;

    // Search by location if coordinates provided
    if (latitude && longitude) {
      workers = await Worker.find({
        ...query,
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: parseInt(maxDistance),
          },
        },
      }).select("-password");
    } else {
      workers = await Worker.find(query).select("-password");
    }

    res.status(200).json({
      success: true,
      count: workers.length,
      data: workers,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single worker
// @route   GET /api/workers/:id
// @access  Public
exports.getWorker = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id).select("-password");

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    res.status(200).json({
      success: true,
      data: worker,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update worker profile
// @route   PUT /api/workers/:id
// @access  Private (Worker only)
exports.updateWorker = async (req, res) => {
  try {
    // Check if worker is updating their own profile
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this profile",
      });
    }

    const allowedFields = [
      "name",
      "phone",
      "bio",
      "experience",
      "hourlyRate",
      "location",
      "availability",
    ];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const worker = await Worker.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json({
      success: true,
      data: worker,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add certificate
// @route   POST /api/workers/:id/certificates
// @access  Private (Worker only)
exports.addCertificate = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const worker = await Worker.findById(req.params.id);

    const certificate = {
      name: req.body.name,
      issuedBy: req.body.issuedBy,
      issuedDate: req.body.issuedDate,
      certificateUrl: req.body.certificateUrl,
    };

    worker.certificates.push(certificate);
    await worker.save();

    res.status(200).json({
      success: true,
      data: worker,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update worker availability
// @route   PUT /api/workers/:id/availability
// @access  Private (Worker only)
exports.updateAvailability = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const worker = await Worker.findByIdAndUpdate(
      req.params.id,
      { availability: req.body.availability },
      { new: true, runValidators: true },
    ).select("-password");

    res.status(200).json({
      success: true,
      data: worker,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
