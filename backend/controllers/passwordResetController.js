const crypto = require("crypto");
const Worker = require("../models/Worker");
const Customer = require("../models/Customer");
const Admin = require("../models/Admin");
const HardwareShop = require("../models/HardwareShop");
const { sendEmail } = require("../utils/sendEmail");

const MODELS = {
  worker: Worker,
  customer: Customer,
  admin: Admin,
  hardwareShop: HardwareShop,
};

const hashOtp = (otp) => crypto.createHash("sha256").update(otp).digest("hex");

// @desc    Send a password reset code to the account's email
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email, userType } = req.body;
    const Model = MODELS[userType];
    if (!Model) {
      return res.status(400).json({ success: false, message: "Invalid account type" });
    }
    if (!email) {
      return res.status(400).json({ success: false, message: "Please provide an email" });
    }

    const user = await Model.findOne({ email: String(email).trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email",
      });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.resetPasswordOTP = hashOtp(otp);
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    try {
      await sendEmail({
        to: user.email,
        subject: "Your ClickFix password reset code",
        html: `<p>Your password reset code is:</p><h2 style="letter-spacing:4px;">${otp}</h2><p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>`,
      });
    } catch (mailError) {
      console.error("sendEmail failed:", mailError.message);
      user.resetPasswordOTP = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      return res.status(500).json({
        success: false,
        message: "Failed to send the reset email. Please try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: "A reset code has been sent to your email",
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify the reset code and set a new password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { email, userType, otp, newPassword } = req.body;
    const Model = MODELS[userType];
    if (!Model) {
      return res.status(400).json({ success: false, message: "Invalid account type" });
    }
    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide email, code, and new password",
      });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    const user = await Model.findOne({
      email: String(email).trim().toLowerCase(),
    }).select("+resetPasswordOTP +resetPasswordExpire");

    if (!user || !user.resetPasswordOTP || !user.resetPasswordExpire) {
      return res.status(400).json({ success: false, message: "Invalid or expired code" });
    }
    if (user.resetPasswordExpire < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "This code has expired. Please request a new one.",
      });
    }
    if (user.resetPasswordOTP !== hashOtp(String(otp).trim())) {
      return res.status(400).json({ success: false, message: "Incorrect code" });
    }

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    res.status(200).json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
