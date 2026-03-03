const Customer = require("../models/Customer");

// @desc    Get customer profile
// @route   GET /api/customers/:id
// @access  Private
exports.getCustomer = async (req, res) => {
  try {
    // Users can only view their own profile
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const customer = await Customer.findById(req.params.id)
      .select("-password")
      .populate("favoriteWorkers", "name category rating hourlyRate");

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update customer profile
// @route   PUT /api/customers/:id
// @access  Private (Customer only)
exports.updateCustomer = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const allowedFields = ["name", "phone"];
    const updates = {};

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const customer = await Customer.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add address
// @route   POST /api/customers/:id/addresses
// @access  Private (Customer only)
exports.addAddress = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const customer = await Customer.findById(req.params.id);

    const address = {
      label: req.body.label,
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode,
      location: req.body.location,
    };

    customer.addresses.push(address);
    await customer.save();

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add to favorites
// @route   POST /api/customers/:id/favorites/:workerId
// @access  Private (Customer only)
exports.addFavorite = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const customer = await Customer.findById(req.params.id);

    if (!customer.favoriteWorkers.includes(req.params.workerId)) {
      customer.favoriteWorkers.push(req.params.workerId);
      await customer.save();
    }

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Remove from favorites
// @route   DELETE /api/customers/:id/favorites/:workerId
// @access  Private (Customer only)
exports.removeFavorite = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const customer = await Customer.findById(req.params.id);

    customer.favoriteWorkers = customer.favoriteWorkers.filter(
      (id) => id.toString() !== req.params.workerId,
    );
    await customer.save();

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add wallet transaction
// @route   POST /api/customers/:id/wallet
// @access  Private (Customer only)
exports.addWalletTransaction = async (req, res) => {
  try {
    if (req.user._id.toString() !== req.params.id) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    const customer = await Customer.findById(req.params.id);
    const { amount, type, description } = req.body;

    if (type === "credit") {
      customer.wallet.balance += amount;
    } else if (type === "debit") {
      if (customer.wallet.balance < amount) {
        return res.status(400).json({
          success: false,
          message: "Insufficient wallet balance",
        });
      }
      customer.wallet.balance -= amount;
    }

    customer.wallet.transactions.push({
      amount,
      type,
      description,
    });

    await customer.save();

    res.status(200).json({
      success: true,
      data: customer,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
