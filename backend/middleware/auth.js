const jwt = require("jsonwebtoken");
const Worker = require("../models/Worker");
const Customer = require("../models/Customer");

exports.protect = async (req, res, next) => {
  try {
    let token;

    // Get token from header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized to access this route",
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Check user type and attach user to request
      if (decoded.userType === "worker") {
        req.user = await Worker.findById(decoded.id);
        req.userType = "worker";
      } else if (decoded.userType === "customer") {
        req.user = await Customer.findById(decoded.id);
        req.userType = "customer";
      }

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "User not found",
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Token is invalid or expired",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error in authentication",
    });
  }
};

// Authorize specific user types
exports.authorize = (...userTypes) => {
  return (req, res, next) => {
    if (!userTypes.includes(req.userType)) {
      return res.status(403).json({
        success: false,
        message: `User type ${req.userType} is not authorized to access this route`,
      });
    }
    next();
  };
};
