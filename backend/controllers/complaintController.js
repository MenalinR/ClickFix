const Complaint = require("../models/Complaint");

// @desc    Submit a complaint about a worker
// @route   POST /api/complaints
// @access  Private (Customer only)
exports.createComplaint = async (req, res) => {
  try {
    const { workerId, jobId, category, description } = req.body;

    if (!workerId || !category || !description) {
      return res.status(400).json({
        success: false,
        message: "workerId, category, and description are required",
      });
    }

    const complaint = await Complaint.create({
      customerId: req.user._id,
      workerId,
      jobId: jobId || undefined,
      category,
      description,
    });

    res.status(201).json({ success: true, data: complaint });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all complaints (admin) or own complaints (customer)
// @route   GET /api/complaints
// @access  Private (Admin or Customer)
exports.getComplaints = async (req, res) => {
  try {
    const filter = {};

    if (req.user.userType === "customer") {
      filter.customerId = req.user._id;
    }

    if (req.query.status) filter.status = req.query.status;
    if (req.query.workerId) filter.workerId = req.query.workerId;

    const complaints = await Complaint.find(filter)
      .populate("customerId", "name email phone")
      .populate("workerId", "name category image")
      .populate("jobId", "serviceType scheduledDate")
      .sort("-createdAt");

    res.status(200).json({ success: true, count: complaints.length, data: complaints });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update complaint status and admin notes
// @route   PATCH /api/complaints/:id
// @access  Private (Admin only)
exports.updateComplaint = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;

    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    if (status) complaint.status = status;
    if (adminNotes !== undefined) complaint.adminNotes = adminNotes;

    await complaint.save();

    const updated = await Complaint.findById(complaint._id)
      .populate("customerId", "name email phone")
      .populate("workerId", "name category image")
      .populate("jobId", "serviceType scheduledDate");

    res.status(200).json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
