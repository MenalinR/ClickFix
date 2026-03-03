const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Create storage for different types of uploads
const createStorage = (folder) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: folder,
      allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
      transformation: [{ width: 1000, height: 1000, crop: "limit" }],
    },
  });
};

// Upload middleware for different types
exports.uploadJobImages = multer({
  storage: createStorage("clickfix/jobs"),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
}).array("images", 5);

exports.uploadCertificate = multer({
  storage: createStorage("clickfix/certificates"),
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("certificate");

exports.uploadProfilePicture = multer({
  storage: createStorage("clickfix/profiles"),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
}).single("profilePicture");

exports.uploadReviewImages = multer({
  storage: createStorage("clickfix/reviews"),
  limits: { fileSize: 5 * 1024 * 1024 },
}).array("images", 4);

// Delete image from cloudinary
exports.deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
    return true;
  } catch (error) {
    console.error("Error deleting image:", error);
    return false;
  }
};

module.exports.cloudinary = cloudinary;
