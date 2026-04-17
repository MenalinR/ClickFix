const Worker = require("../models/Worker");
const Customer = require("../models/Customer");
const Admin = require("../models/Admin");
const HardwareShop = require("../models/HardwareShop");
const { sendTokenResponse } = require("../utils/auth");

// @desc    Register Worker
// @route   POST /api/auth/worker/register
// @access  Public
exports.registerWorker = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      category,
      experience,
      hourlyRate,
      location,
    } = req.body;

    const normalizedLocation = {
      type: "Point",
      coordinates: location?.coordinates || [0, 0],
      address: location?.address || "Not provided",
      city: location?.city || "",
      district: location?.district || "",
    };

    // Check if worker exists
    const existingWorker = await Worker.findOne({ email });
    if (existingWorker) {
      return res.status(400).json({
        success: false,
        message: "Worker with this email already exists",
      });
    }

    // Create worker
    const worker = await Worker.create({
      name,
      email,
      phone,
      password,
      category,
      experience,
      hourlyRate,
      location: normalizedLocation,
    });

    sendTokenResponse(worker, 201, res, "worker");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Register Customer
// @route   POST /api/auth/customer/register
// @access  Public
exports.registerCustomer = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    // Check if customer exists
    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: "Customer with this email already exists",
      });
    }

    // Create customer
    const customer = await Customer.create({
      name,
      email,
      phone,
      password,
    });

    sendTokenResponse(customer, 201, res, "customer");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Login Worker
// @route   POST /api/auth/worker/login
// @access  Public
exports.loginWorker = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Check for worker
    const worker = await Worker.findOne({ email }).select("+password");
    if (!worker) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await worker.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    sendTokenResponse(worker, 200, res, "worker");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Login Customer
// @route   POST /api/auth/customer/login
// @access  Public
exports.loginCustomer = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Check for customer
    const customer = await Customer.findOne({ email }).select("+password");
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check password
    const isMatch = await customer.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    sendTokenResponse(customer, 200, res, "customer");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Login Admin
// @route   POST /api/auth/admin/login
// @access  Public
exports.loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Check for admin
    const admin = await Admin.findOne({ email }).select("+password");
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if admin is active
    if (!admin.isActive) {
      return res.status(401).json({
        success: false,
        message: "Admin account is inactive",
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    admin.lastLogin = Date.now();
    await admin.save();

    sendTokenResponse(admin, 200, res, "admin");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Register Hardware Shop
// @route   POST /api/auth/hardwareShop/register
// @access  Public
exports.registerHardwareShop = async (req, res) => {
  try {
    const {
      shopName,
      email,
      phone,
      password,
      address,
      city,
      licenseNumber,
    } = req.body;

    // Check if hardware shop exists
    const existingShop = await HardwareShop.findOne({ email });
    if (existingShop) {
      return res.status(400).json({
        success: false,
        message: "Hardware shop with this email already exists",
      });
    }

    // Create hardware shop
    const shop = await HardwareShop.create({
      shopName,
      email,
      phone,
      password,
      address,
      city,
      licenseNumber,
    });

    sendTokenResponse(shop, 201, res, "hardwareShop");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Login Hardware Shop
// @route   POST /api/auth/hardwareShop/login
// @access  Public
exports.loginHardwareShop = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Check for hardware shop
    const shop = await HardwareShop.findOne({ email }).select("+password");
    if (!shop) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Check if shop is active
    if (!shop.isActive) {
      return res.status(401).json({
        success: false,
        message: "Shop account is inactive",
      });
    }

    // Check password
    const isMatch = await shop.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Update last login
    shop.lastLogin = Date.now();
    await shop.save();

    sendTokenResponse(shop, 200, res, "hardwareShop");
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    let user;
    if (req.userType === "worker") {
      user = await Worker.findById(req.user._id);
    } else if (req.userType === "customer") {
      user = await Customer.findById(req.user._id);
    } else if (req.userType === "admin") {
      user = await Admin.findById(req.user._id);
    } else if (req.userType === "hardwareShop") {
      user = await HardwareShop.findById(req.user._id);
    }

    res.status(200).json({
      success: true,
      data: user,
      userType: req.userType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
