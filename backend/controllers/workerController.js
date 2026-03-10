const Worker = require("../models/Worker");
const Admin = require("../models/Admin");
const path = require("path");
const { createNotification } = require("./notificationController");

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
      approved,
    } = req.query;

    let query = { availability: "Available", isActive: true };

    if (approved === "true") {
      query = {
        ...query,
        $or: [
          { nicVerified: true },
          { "idProof.verificationStatus": "Verified" },
        ],
      };
    }

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
    console.log("🔧 Update Worker - Worker ID:", req.params.id);
    console.log("🔧 Update Worker - Request Body:", JSON.stringify(req.body));

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
      "skills",
      "image",
    ];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    if (req.body.about !== undefined && req.body.bio === undefined) {
      updates.bio = req.body.about;
    }

    console.log("🔧 Update Worker - Updates Object:", JSON.stringify(updates));

    const worker = await Worker.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    console.log("🔧 Update Worker - Result Skills:", worker.skills);
    console.log("🔧 Update Worker - Result Image:", worker.image);

    res.status(200).json({
      success: true,
      data: worker,
    });
  } catch (error) {
    console.error("❌ Update Worker Error:", error);
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
    console.log("📥 Upload ID Proof request received");
    console.log("User:", req.user?._id);
    console.log("Params ID:", req.params.id);
    console.log("File:", req.file ? "✅ File present" : "❌ No file");
    console.log("Body:", req.body);

    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Check if file was uploaded via multer
    if (!req.file) {
      console.error("❌ No file uploaded - multer did not receive file");
      return res.status(400).json({
        success: false,
        message: "Please upload a document file",
      });
    }

    console.log(
      "✅ File received:",
      req.file.originalname,
      req.file.size,
      "bytes",
    );

    const { documentType, nicNumber } = req.body;

    if (!documentType) {
      return res.status(400).json({
        success: false,
        message: "Document type is required",
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

    // Create accessible URL for the uploaded file
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    // Extract relative path from uploads folder
    const relativePath = req.file.path
      .split("uploads")[1]
      .replace(/\\/g, "/")
      .replace(/^\//, "");
    const fileUrl = `${baseUrl}/uploads/${relativePath}`;

    // Update ID proof with accessible file URL
    worker.idProof = {
      url: fileUrl,
      documentType,
      uploadedAt: new Date(),
      verificationStatus: "Pending", // Admin will verify
    };

    if (nicNumber) {
      worker.nicNumber = nicNumber;
    }

    await worker.save();

    // Create notification for all admins
    try {
      const admins = await Admin.find({ isActive: true });
      const notificationPromises = admins.map((admin) =>
        createNotification({
          recipient: admin._id,
          recipientModel: "Admin",
          type: "DOCUMENT_UPLOADED",
          title: "New ID Proof Uploaded",
          message: `${worker.name} (${worker.category}) uploaded ${documentType} for verification`,
          data: {
            workerId: worker._id.toString(),
            workerName: worker.name,
            documentType,
          },
          actionUrl: "/admin/documents",
        }),
      );
      await Promise.all(notificationPromises);
      console.log(`✅ Notification sent to ${admins.length} admin(s)`);
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
      // Don't fail the upload if notification fails
    }

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

    // Check if file was uploaded via multer
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a document file",
      });
    }

    const {
      documentName,
      description,
      documentType = "Certificate",
      issueDate,
      expiryDate,
    } = req.body;

    if (!documentName) {
      return res.status(400).json({
        success: false,
        message: "Document name is required",
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

    // Create accessible URL for the uploaded file
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    // Extract relative path from uploads folder
    const relativePath = req.file.path
      .split("uploads")[1]
      .replace(/\\/g, "/")
      .replace(/^\//, "");
    const fileUrl = `${baseUrl}/uploads/${relativePath}`;

    // Add experience document with accessible file URL
    const newDocument = {
      name: documentName,
      description: description || "",
      url: fileUrl,
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

// @desc    Upload Education Documents (Degrees, Diplomas, Certificates)
// @route   POST /api/workers/:id/upload-education
// @access  Private (Worker only)
exports.uploadEducationDocument = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Check if file was uploaded via multer
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a document file",
      });
    }

    const {
      documentName,
      institution,
      description,
      documentType = "Certificate",
      startDate,
      endDate,
    } = req.body;

    if (!documentName) {
      return res.status(400).json({
        success: false,
        message: "Document name is required",
      });
    }

    // Validate document type
    const validTypes = ["Degree", "Diploma", "Certificate", "Other"];
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

    // Create accessible URL for the uploaded file
    const baseUrl = `${req.protocol}://${req.get("host")}`;
    // Extract relative path from uploads folder
    const relativePath = req.file.path
      .split("uploads")[1]
      .replace(/\\/g, "/")
      .replace(/^\//, "");
    const fileUrl = `${baseUrl}/uploads/${relativePath}`;

    // Add education document with accessible file URL
    const newDocument = {
      name: documentName,
      institution: institution || "",
      description: description || "",
      url: fileUrl,
      documentType,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
      uploadedAt: new Date(),
      verificationStatus: "Verified",
      verifiedAt: new Date(),
    };

    worker.educationDocuments.push(newDocument);
    await worker.save();

    res.status(200).json({
      success: true,
      message: "Education document added successfully.",
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
      "idProof experienceDocuments educationDocuments nicVerified",
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
        educationDocuments: worker.educationDocuments,
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

    // Create notification for worker
    try {
      await createNotification({
        recipient: worker._id,
        recipientModel: "Worker",
        type: status === "Verified" ? "DOCUMENT_VERIFIED" : "DOCUMENT_REJECTED",
        title: `ID Proof ${status}`,
        message:
          status === "Verified"
            ? "Your ID proof has been verified successfully!"
            : `Your ID proof was rejected. ${notes || "Please upload a valid document."}`,
        data: {
          workerId: worker._id.toString(),
          workerName: worker.name,
          documentType: "ID Proof",
          status,
          notes: notes || "",
        },
        actionUrl: "/worker/documents",
      });
      console.log(`✅ Notification sent to worker: ${worker.name}`);
    } catch (notifError) {
      console.error("Error creating notification:", notifError);
      // Don't fail the verification if notification fails
    }

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

// @desc    Upload profile image
// @route   POST /api/workers/:id/upload-image
// @access  Private (Worker only)
exports.uploadProfileImage = async (req, res) => {
  try {
    console.log("📥 Upload profile image request received");
    console.log("User:", req.user?._id);
    console.log("Params ID:", req.params.id);
    console.log("File:", req.file ? "✅ File present" : "❌ No file");

    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (!req.file) {
      console.error("❌ No file uploaded - multer did not receive file");
      return res.status(400).json({
        success: false,
        message: "Please upload an image file",
      });
    }

    const worker = await Worker.findById(req.params.id);

    if (!worker) {
      return res.status(404).json({
        success: false,
        message: "Worker not found",
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const relativePath = req.file.path
      .split("uploads")[1]
      .replace(/\\/g, "/")
      .replace(/^\//, "");
    const imageUrl = `${baseUrl}/uploads/${relativePath}`;

    worker.image = imageUrl;
    await worker.save();

    res.status(200).json({
      success: true,
      message: "Profile image updated successfully",
      data: { image: imageUrl },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
