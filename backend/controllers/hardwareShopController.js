const { HardwareItem, HardwareRequest } = require("../models/Hardware");

// @desc    Get all items for hardware shop
// @route   GET /api/hardwareShop/items
// @access  Private (hardwareShop)
exports.getItems = async (req, res) => {
  try {
    const items = await HardwareItem.find({ shopId: req.user._id }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Add new hardware item
// @route   POST /api/hardwareShop/items
// @access  Private (hardwareShop)
exports.addItem = async (req, res) => {
  try {
    const { name, category, price, unit, description, image, inStock } =
      req.body;

    // Validate required fields
    if (!name || !category || !price) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, category, and price",
      });
    }

    const item = await HardwareItem.create({
      shopId: req.user._id,
      name,
      category,
      price,
      unit: unit || "piece",
      description: description || "",
      image: image || null,
      inStock: inStock !== undefined ? inStock : true,
    });

    res.status(201).json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update hardware item
// @route   PUT /api/hardwareShop/items/:id
// @access  Private (hardwareShop)
exports.updateItem = async (req, res) => {
  try {
    let item = await HardwareItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Verify ownership
    if (item.shopId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this item",
      });
    }

    item = await HardwareItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete hardware item
// @route   DELETE /api/hardwareShop/items/:id
// @access  Private (hardwareShop)
exports.deleteItem = async (req, res) => {
  try {
    const item = await HardwareItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    // Verify ownership
    if (item.shopId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this item",
      });
    }

    await HardwareItem.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get hardware shop stats
// @route   GET /api/hardwareShop/stats
// @access  Private (hardwareShop)
exports.getStats = async (req, res) => {
  try {
    const totalItems = await HardwareItem.countDocuments({
      shopId: req.user._id,
    });

    const pendingOrders = await HardwareRequest.countDocuments({
      status: "pending",
    });

    const approvedOrders = await HardwareRequest.countDocuments({
      status: "approved",
    });

    const deliveredOrders = await HardwareRequest.countDocuments({
      status: "delivered",
    });

    res.status(200).json({
      success: true,
      data: {
        totalItems,
        pendingOrders,
        approvedOrders,
        deliveredOrders,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get hardware orders for shop
// @route   GET /api/hardwareShop/orders
// @access  Private (hardwareShop)
exports.getOrders = async (req, res) => {
  try {
    const { status } = req.query;

    // Get all items owned by this shop
    const items = await HardwareItem.find({ shopId: req.user._id }).select(
      "_id",
    );
    const itemIds = items.map((item) => item._id);

    // Find requests that include items from this shop
    let query = {
      items: { $elemMatch: { hardwareId: { $in: itemIds } } },
    };

    if (status) {
      query.status = status;
    }

    const orders = await HardwareRequest.find(query)
      .populate("jobId", "serviceType status")
      .populate("workerId", "name phone category")
      .populate("customerId", "name phone")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
