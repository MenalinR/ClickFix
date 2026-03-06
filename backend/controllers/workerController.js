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

// @desc    Upload ID Proof for verification
// @route   POST /api/workers/:id/upload-id-proof
// @access  Private (Worker only)
exports.uploadIDProof = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const { documentUrl, documentType, nicNumber } = req.body;

    if (!documentUrl || !documentType) {
      return res.status(400).json({
        success: false,
        message: "Document URL and type are required",
      });
    }

    // Validate document type
    const validTypes = ["NIC", "Passport", "DrivingLicense", "Other"];
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document type",
      });
    }

    const worker = await Worker.findById(req.params.id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    // Update ID proof
    worker.idProof = {
      url: documentUrl,
      documentType,
      uploadedAt: new Date(),
      verificationStatus: "Pending", // Admin will verify
    };

    if (nicNumber) {
      worker.nicNumber = nicNumber;
    }

    await worker.save();

    res.status(200).json({
      success: true,
      message:
        "ID proof uploaded successfully. Waiting for admin verification.",
      data: worker,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Upload Experience Documents (Certificates)
// @route   POST /api/workers/:id/upload-experience
// @access  Private (Worker only)
exports.uploadExperienceDocument = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const {
      documentUrl,
      documentName,
      description,
      documentType = "Certificate",
      issueDate,
      expiryDate,
    } = req.body;

    if (!documentUrl || !documentName) {
      return res.status(400).json({
        success: false,
        message: "Document URL and name are required",
      });
    }

    // Validate document type
    const validTypes = ["Certificate", "License", "Training", "Other"];
    if (!validTypes.includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid document type",
      });
    }

    const worker = await Worker.findById(req.params.id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    // Add experience document
    const newDocument = {
      name: documentName,
      description: description || "",
      url: documentUrl,
      documentType,
      issueDate: issueDate ? new Date(issueDate) : null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      uploadedAt: new Date(),
      verificationStatus: "Verified",
      verifiedAt: new Date(),
    };

    worker.experienceDocuments.push(newDocument);
    await worker.save();

    res.status(200).json({
      success: true,
      message: "Experience proof added successfully.",
      data: worker,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get worker verification status
// @route   GET /api/workers/:id/verification-status
// @access  Private (Worker only)
exports.getVerificationStatus = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id).select(
      "idProof experienceDocuments nicVerified",
    );

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        idProof: worker.idProof,
        experienceDocuments: worker.experienceDocuments,
        isFullyVerified:
          worker.nicVerified ||
          worker.idProof?.verificationStatus === "Verified",
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Verify worker ID Proof (Admin only)
// @route   PUT /api/workers/:id/verify-id-proof
// @access  Private (Admin only)
exports.verifyIDProof = async (req, res) => {
  try {
    const { status, notes } = req.body; // status: "Verified" or "Rejected"

    if (!["Verified", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'Verified' or 'Rejected'",
      });
    }

    const worker = await Worker.findById(req.params.id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    if (!worker.idProof || !worker.idProof.url) {
      return res.status(400).json({
        success: false,
        message: "No ID proof document found for this worker",
      });
    }

    // Update verification status
    worker.idProof.verificationStatus = status;
    worker.idProof.verificationNotes = notes || "";
    worker.idProof.verifiedAt = new Date();

    // If verified, set nicVerified flag
    if (status === "Verified") {
      worker.nicVerified = true;
    }

    await worker.save();

    res.status(200).json({
      success: true,
      message: `ID proof ${status.toLowerCase()} successfully`,
      data: worker,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Verify experience document (Admin only)
// @route   PUT /api/workers/:id/verify-experience/:docId
// @access  Private (Admin only)
exports.verifyExperienceDocument = async (req, res) => {
  try {
    const { status, notes } = req.body; // status: "Verified" or "Rejected"

    if (!["Verified", "Rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be either 'Verified' or 'Rejected'",
      });
    }

    const worker = await Worker.findById(req.params.id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    const document = worker.experienceDocuments.id(req.params.docId);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    // Update verification status
    document.verificationStatus = status;
    document.verificationNotes = notes || "";
    document.verifiedAt = new Date();

    await worker.save();

    res.status(200).json({
      success: true,
      message: `Document ${status.toLowerCase()} successfully`,
      data: worker,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all pending documents for admin review
// @route   GET /api/admin/pending-documents
// @access  Private (Admin only)
exports.getPendingDocuments = async (req, res) => {
  try {
    const workers = await Worker.find({
      "idProof.verificationStatus": "Pending",
    }).select("name email phone category idProof created");

    const pendingDocs = [];

    workers.forEach((worker) => {
      // Check ID proof
      if (worker.idProof?.verificationStatus === "Pending") {
        pendingDocs.push({
          workerId: worker._id,
          workerName: worker.name,
          workerEmail: worker.email,
          workerPhone: worker.phone,
          category: worker.category,
          documentType: "ID Proof",
          document: worker.idProof,
          uploadedAt: worker.idProof.uploadedAt,
        });
      }
    });

    res.status(200).json({
      success: true,
      data: pendingDocs,
      count: pendingDocs.length,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
