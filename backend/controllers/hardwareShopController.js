const { HardwareItem, HardwareRequest } = require("../models/Hardware");
const HardwareShop = require("../models/HardwareShop");

// @desc    Set the shop's map location from the shop device's GPS
// @route   PUT /api/hardwareShop/location
// @access  Private (hardwareShop)
exports.updateShopLocation = async (req, res) => {
  try {
    const { latitude, longitude } = req.body || {};
    if (typeof latitude !== "number" || typeof longitude !== "number") {
      return res.status(400).json({
        success: false,
        message: "latitude and longitude are required numbers",
      });
    }
    const shop = await HardwareShop.findByIdAndUpdate(
      req.user._id,
      {
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
          updatedAt: new Date(),
        },
      },
      { new: true },
    ).select("-password");

    res.status(200).json({ success: true, data: shop });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    List active hardware shops (public to authenticated workers)
// @route   GET /api/hardwareShop/list
// @access  Private (Worker)
exports.listShops = async (req, res) => {
  try {
    const { city } = req.query;
    const query = { isActive: true };
    if (city) query.city = city;

    const shops = await HardwareShop.find(query)
      .select("shopName city address phone")
      .sort("shopName");

    res.status(200).json({
      success: true,
      count: shops.length,
      data: shops,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: list all hardware shops
// @route   GET /api/hardwareShop/admin/shops
// @access  Private (Admin)
exports.adminListShops = async (req, res) => {
  try {
    const shops = await HardwareShop.find()
      .select("-password")
      .sort("shopName");
    res.status(200).json({
      success: true,
      count: shops.length,
      data: shops,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin: delete a hardware shop
// @route   DELETE /api/hardwareShop/admin/shops/:id
// @access  Private (Admin)
exports.adminDeleteShop = async (req, res) => {
  try {
    const shop = await HardwareShop.findByIdAndDelete(req.params.id);
    if (!shop) {
      return res
        .status(404)
        .json({ success: false, message: "Hardware shop not found" });
    }
    res.status(200).json({ success: true, message: "Hardware shop deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

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
    const shopId = req.user._id;

    const totalItems = await HardwareItem.countDocuments({ shopId });

    const pendingOrders = await HardwareRequest.countDocuments({
      shopId,
      status: "pending",
    });

    const approvedOrders = await HardwareRequest.countDocuments({
      shopId,
      status: "approved",
    });

    const deliveredOrders = await HardwareRequest.countDocuments({
      shopId,
      status: "delivered",
    });

    // Count "new" pending orders — pending orders the shop hasn't viewed yet.
    // If lastOrdersViewedAt isn't set, every pending order counts as new.
    const lastViewed = req.user.lastOrdersViewedAt;
    const newPendingQuery = { shopId, status: "pending" };
    if (lastViewed) {
      newPendingQuery.createdAt = { $gt: lastViewed };
    }
    const newPendingOrders = await HardwareRequest.countDocuments(newPendingQuery);

    res.status(200).json({
      success: true,
      data: {
        totalItems,
        pendingOrders,
        newPendingOrders,
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

// @desc    Mark all orders as viewed (clears the badge)
// @route   PUT /api/hardwareShop/orders/mark-viewed
// @access  Private (hardwareShop)
exports.markOrdersViewed = async (req, res) => {
  try {
    await HardwareShop.findByIdAndUpdate(req.user._id, {
      lastOrdersViewedAt: new Date(),
    });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload a profile image for the hardware shop
// @route   POST /api/hardwareShop/upload-image
// @access  Private (hardwareShop)
exports.uploadShopImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file",
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const relativePath = req.file.path
      .split("uploads")[1]
      .replace(/\\/g, "/")
      .replace(/^\//, "");
    const imageUrl = `${baseUrl}/uploads/${relativePath}`;

    const shop = await HardwareShop.findByIdAndUpdate(
      req.user._id,
      { image: imageUrl },
      { new: true },
    ).select("-password");

    res.status(200).json({
      success: true,
      data: { url: imageUrl, shop },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update hardware shop profile
// @route   PUT /api/hardwareShop/profile
// @access  Private (hardwareShop)
exports.updateShopProfile = async (req, res) => {
  try {
    const allowed = ["shopName", "phone", "address", "city"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        const value = String(req.body[key]).trim();
        if (key === "shopName" && !value) {
          return res
            .status(400)
            .json({ success: false, message: "Shop name cannot be empty" });
        }
        updates[key] = value;
      }
    }

    const shop = await HardwareShop.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!shop) {
      return res
        .status(404)
        .json({ success: false, message: "Shop not found" });
    }

    res.status(200).json({ success: true, data: shop });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload an image for a hardware item
// @route   POST /api/hardwareShop/items/upload-image
// @access  Private (hardwareShop)
exports.uploadItemImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file",
      });
    }

    const baseUrl = `${req.protocol}://${req.get("host")}`;
    const relativePath = req.file.path
      .split("uploads")[1]
      .replace(/\\/g, "/")
      .replace(/^\//, "");
    const imageUrl = `${baseUrl}/uploads/${relativePath}`;

    res.status(200).json({
      success: true,
      data: { url: imageUrl },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: load an order that belongs to the current shop and is in one of `allowedStatuses`.
async function loadShopOrder(req, allowedStatuses) {
  const order = await HardwareRequest.findById(req.params.id);
  if (!order) {
    return { error: { code: 404, message: "Order not found" } };
  }
  const ownedByShop =
    order.shopId && order.shopId.toString() === req.user._id.toString();
  if (!ownedByShop) {
    return { error: { code: 403, message: "Not authorized" } };
  }
  if (!allowedStatuses.includes(order.status)) {
    return {
      error: {
        code: 400,
        message: `Order is in status "${order.status}", expected one of: ${allowedStatuses.join(", ")}`,
      },
    };
  }
  return { order };
}

async function notifyWorker(order, title, message) {
  if (!order.workerId) return;
  try {
    const { createNotification } = require("./notificationController");
    await createNotification({
      recipient: order.workerId,
      recipientModel: "Worker",
      type: "HARDWARE_ORDER",
      title,
      message,
      data: { jobId: order.jobId, requestId: order._id },
      actionUrl: "/hardware-updates",
    });
  } catch (e) {
    // non-fatal
  }
}

// @desc    Shop accepts a pending order
// @route   PUT /api/hardwareShop/orders/:id/accept
// @access  Private (hardwareShop)
exports.acceptOrder = async (req, res) => {
  try {
    const { order, error } = await loadShopOrder(req, ["pending"]);
    if (error) return res.status(error.code).json({ success: false, message: error.message });

    order.status = "approved";
    await order.save();

    const shop = await HardwareShop.findById(req.user._id).select("shopName");
    await notifyWorker(
      order,
      "Order accepted",
      `${shop?.shopName || "The shop"} accepted your hardware order.`,
    );

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Shop rejects a pending order
// @route   PUT /api/hardwareShop/orders/:id/reject
// @access  Private (hardwareShop)
exports.rejectOrder = async (req, res) => {
  try {
    const reason = (req.body?.reason || "").toString().trim();
    const { order, error } = await loadShopOrder(req, ["pending"]);
    if (error) return res.status(error.code).json({ success: false, message: error.message });

    order.status = "rejected";
    if (reason) order.customerNote = reason;
    await order.save();

    const shop = await HardwareShop.findById(req.user._id).select("shopName");
    await notifyWorker(
      order,
      "Order rejected",
      reason
        ? `${shop?.shopName || "The shop"} rejected your order: ${reason}`
        : `${shop?.shopName || "The shop"} rejected your hardware order.`,
    );

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Shop marks order as packing
// @route   PUT /api/hardwareShop/orders/:id/mark-packing
// @access  Private (hardwareShop)
exports.markPacking = async (req, res) => {
  try {
    const { order, error } = await loadShopOrder(req, ["approved"]);
    if (error) return res.status(error.code).json({ success: false, message: error.message });

    order.status = "packing";
    await order.save();

    const shop = await HardwareShop.findById(req.user._id).select("shopName");
    await notifyWorker(
      order,
      "Order is being packed",
      `${shop?.shopName || "The shop"} is packing your order.`,
    );

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Shop marks order as ready for pickup
// @route   PUT /api/hardwareShop/orders/:id/mark-ready
// @access  Private (hardwareShop)
exports.markReady = async (req, res) => {
  try {
    const { order, error } = await loadShopOrder(req, ["approved", "packing"]);
    if (error) return res.status(error.code).json({ success: false, message: error.message });

    order.status = "ready";
    await order.save();

    const shop = await HardwareShop.findById(req.user._id).select("shopName");
    await notifyWorker(
      order,
      "Order ready for pickup",
      `${shop?.shopName || "The shop"} packed your order. It's ready for pickup.`,
    );

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Shop marks order as completed (worker has collected the items)
// @route   PUT /api/hardwareShop/orders/:id/complete
// @access  Private (hardwareShop)
exports.completeOrder = async (req, res) => {
  try {
    const { order, error } = await loadShopOrder(req, ["ready", "coming"]);
    if (error) return res.status(error.code).json({ success: false, message: error.message });

    order.status = "picked_up";
    await order.save();

    const shop = await HardwareShop.findById(req.user._id).select("shopName");
    await notifyWorker(
      order,
      "Order completed",
      `You picked up your order from ${shop?.shopName || "the shop"}.`,
    );

    res.status(200).json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get hardware orders for shop
// @route   GET /api/hardwareShop/orders
// @access  Private (hardwareShop)
exports.getOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const shopId = req.user._id;

    // Match orders directly by shopId (new flow), and also match legacy
    // orders that don't have shopId set but contain items from this shop.
    const items = await HardwareItem.find({ shopId }).select("_id");
    const itemIds = items.map((item) => item._id);

    const query = {
      $or: [
        { shopId },
        {
          shopId: { $exists: false },
          items: { $elemMatch: { hardwareId: { $in: itemIds } } },
        },
      ],
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
