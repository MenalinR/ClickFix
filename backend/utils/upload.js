const multer = require("multer");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Hold the file in memory rather than writing it to local disk — the
// backend's filesystem is ephemeral in production (Render), so anything
// written there is lost on every restart/redeploy. The buffer gets
// forwarded to Cloudinary (see uploadBufferToCloudinary below) for
// permanent storage instead.
const storage = multer.memoryStorage();

// Upload documents (ID proofs, certificates, job photos/videos, etc)
exports.uploadDocument = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB — video clips need more room than photos
  fileFilter: (req, file, cb) => {
    const allowedExt = /\.(jpe?g|png|gif|webp|pdf|mp4|mov|avi|webm|mkv)$/i;
    const extname = allowedExt.test(file.originalname);
    const mimetype =
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/") ||
      file.mimetype === "application/pdf";

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error("Only images, videos, and PDF files are allowed!"));
    }
  },
}).single("document");

// Optional upload middleware - continues even if no file is provided
exports.optionalUploadDocument = (req, res, next) => {
  exports.uploadDocument(req, res, (err) => {
    if (err) {
      // If it's a multer error about no file, continue anyway
      if (err.code === "LIMIT_UNEXPECTED_FILE") {
        return next();
      }
      return res.status(400).json({
        success: false,
        message: err.message || "File upload error",
      });
    }
    next();
  });
};

// Uploads an in-memory file buffer (from the multer middleware above) to
// Cloudinary and resolves with its permanent, secure URL. `folder` groups
// uploads in the Cloudinary dashboard (e.g. "job-images", "documents").
exports.uploadBufferToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: `clickfix/${folder || "documents"}`, resource_type: "auto" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      },
    );
    uploadStream.end(fileBuffer);
  });
};
