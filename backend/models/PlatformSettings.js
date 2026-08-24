const mongoose = require("mongoose");

// Singleton document holding platform-wide, admin-configurable settings.
// Always look it up/create it via getSettings() below rather than querying
// the model directly, so callers don't need to worry about the doc missing.
const platformSettingsSchema = new mongoose.Schema(
  {
    transportRatePerKm: { type: Number, default: 80, min: 0 },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
  },
  { timestamps: true },
);

const PlatformSettings = mongoose.model(
  "PlatformSettings",
  platformSettingsSchema,
);

const getSettings = async () => {
  let settings = await PlatformSettings.findOne();
  if (!settings) {
    settings = await PlatformSettings.create({});
  }
  return settings;
};

module.exports = { PlatformSettings, getSettings };
