const { getSettings } = require("../models/PlatformSettings");

// @desc    Get platform-wide settings (transport rate, etc.)
// @route   GET /api/settings
// @access  Private (admin only)
exports.getPlatformSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update platform-wide settings
// @route   PUT /api/settings
// @access  Private (admin only)
exports.updatePlatformSettings = async (req, res) => {
  try {
    const { transportRatePerKm } = req.body;
    const rate = Number(transportRatePerKm);
    if (transportRatePerKm == null || isNaN(rate) || rate < 0) {
      return res.status(400).json({
        success: false,
        message: "A valid, non-negative transportRatePerKm is required",
      });
    }

    const settings = await getSettings();
    settings.transportRatePerKm = rate;
    settings.updatedBy = req.user._id;
    await settings.save();

    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
