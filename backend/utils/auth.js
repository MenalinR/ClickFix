const jwt = require("jsonwebtoken");

// Generate JWT Token
exports.generateToken = (id, userType) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("Server configuration error: JWT_SECRET is missing");
  }

  return jwt.sign({ id, userType }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "30d",
  });
};

// Send token response
exports.sendTokenResponse = (user, statusCode, res, userType) => {
  const token = this.generateToken(user._id, userType);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      userType,
      ...(userType === "worker" && {
        category: user.category,
        experience: user.experience,
        hourlyRate: user.hourlyRate,
        rating: user.rating,
        reviewCount: user.reviewCount,
        verified: user.verified,
        nicVerified: user.nicVerified,
        image: user.image,
        location: user.location,
        certificates: user.certificates || [],
      }),
      ...(userType === "customer" && {
        image: user.image,
        wallet: user.wallet || { balance: 0 },
        addresses: user.addresses || [],
      }),
      ...(userType === "admin" && {
        role: user.role,
        isActive: user.isActive,
        lastLogin: user.lastLogin,
      }),
    },
  });
};
