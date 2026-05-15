const { HardwareItem, HardwareRequest } = require("../models/Hardware");
const Job = require("../models/Job");
const HardwareShop = require("../models/HardwareShop");
const Message = require("../models/Message");

// @desc    Get all hardware items
// @route   GET /api/hardware/items
// @access  Public
exports.getHardwareItems = async (req, res) => {
  try {
    const { category, search, shopId } = req.query;

    let query = { inStock: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    if (shopId) {
      query.shopId = shopId;
    }

    const items = await HardwareItem.find(query)
      .populate("shopId", "shopName city")
      .sort("name");

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

// @desc    Get single hardware item
// @route   GET /api/hardware/items/:id
// @access  Public
exports.getHardwareItem = async (req, res) => {
  try {
    const item = await HardwareItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Hardware item not found",
      });
    }

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

// @desc    Create hardware request
// @route   POST /api/hardware/requests
// @access  Private (Worker only)
exports.createHardwareRequest = async (req, res) => {
  try {
    const { jobId, items } = req.body;

    // Verify job exists and worker is assigned
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: "Job not found",
      });
    }

    if (job.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    // Calculate total cost
    let totalCost = 0;
    const itemsWithDetails = [];

    for (const item of items) {
      const hardwareItem = await HardwareItem.findById(item.itemId);
      if (!hardwareItem) {
        return res.status(404).json({
          success: false,
          message: `Hardware item ${item.itemId} not found`,
        });
      }

      const itemCost = hardwareItem.price * item.quantity;
      totalCost += itemCost;

      itemsWithDetails.push({
        itemId: item.itemId,
        name: hardwareItem.name,
        quantity: item.quantity,
        unit: hardwareItem.unit,
        pricePerUnit: hardwareItem.price,
        totalPrice: itemCost,
      });
    }

    const request = await HardwareRequest.create({
      jobId,
      workerId: req.user._id,
      customerId: job.customerId,
      items: itemsWithDetails,
      totalCost,
    });

    // Update job with hardware items
    job.hardwareItems = itemsWithDetails;
    await job.save();

    res.status(201).json({
      success: true,
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Create a hardware order from real shop catalog selections
// @route   POST /api/hardware/orders/from-job
// @access  Private (Worker only)
//
// Body: { jobId, shopId, items: [{ hardwareItemId, quantity }] }
// The worker has freely picked items from the shop's catalog. Real prices
// from HardwareItem records become the source of truth for the bill.
exports.createOrderFromJob = async (req, res) => {
  try {
    const { jobId, shopId, items } = req.body || {};
    if (!jobId || !shopId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "jobId, shopId and a non-empty items array are required",
      });
    }

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: "Job not found" });
    }
    if (!job.workerId || job.workerId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const shop = await HardwareShop.findById(shopId);
    if (!shop) {
      return res
        .status(404)
        .json({ success: false, message: "Hardware shop not found" });
    }

    const orderItems = [];
    for (const sel of items) {
      const qty = Math.max(1, Number(sel.quantity) || 1);
      const hwItem = await HardwareItem.findById(sel.hardwareItemId);
      if (!hwItem) {
        return res.status(404).json({
          success: false,
          message: `Hardware item ${sel.hardwareItemId} not found`,
        });
      }
      if (hwItem.shopId.toString() !== shopId.toString()) {
        return res.status(400).json({
          success: false,
          message: `Item ${hwItem.name} does not belong to the chosen shop`,
        });
      }
      orderItems.push({
        hardwareId: hwItem._id,
        name: hwItem.name,
        quantity: qty,
        price: hwItem.price,
      });
    }

    const totalCost = orderItems.reduce(
      (sum, it) => sum + (it.price || 0) * (it.quantity || 1),
      0,
    );

    const request = await HardwareRequest.create({
      jobId: job._id,
      workerId: req.user._id,
      customerId: job.customerId,
      shopId,
      items: orderItems,
      totalCost,
      status: "pending",
    });

    // Replace job.hardwareItems with the actually-ordered items at real prices
    job.hardwareItems = orderItems.map((it) => ({
      name: it.name,
      price: it.price,
      quantity: it.quantity,
      status: "ordered",
    }));
    job.pricing.hardwareCost = totalCost;
    const serviceCharge = job.pricing.serviceCharge || 0;
    job.pricing.totalAmount = serviceCharge + totalCost;
    job.timeline.push({
      status: job.status,
      timestamp: new Date(),
      note: `Hardware ordered from ${shop.shopName} — ${totalCost} LKR (${orderItems.length} item${
        orderItems.length > 1 ? "s" : ""
      })`,
    });
    await job.save();

    // Mark all approved cart messages on this job as "ordered"
    // so the chat bubbles switch state and the Order button disappears.
    await Message.updateMany(
      {
        jobId: job._id,
        messageType: "hardware-cart",
        cartStatus: "approved",
      },
      { $set: { cartStatus: "ordered" } },
    );

    const { createNotification } = require("./notificationController");

    try {
      await createNotification({
        recipient: job.customerId,
        recipientModel: "Customer",
        type: "JOB_ASSIGNED",
        title: "Hardware ordered",
        message: `Worker placed a hardware order at ${shop.shopName} — ${totalCost} LKR added to your bill.`,
        data: { jobId: job._id, requestId: request._id },
        actionUrl: "/(customer)/(tabs)/bookings",
      });
    } catch (e) {
      // non-fatal
    }

    // Notify the hardware shop about the incoming order
    try {
      await createNotification({
        recipient: shopId,
        recipientModel: "HardwareShop",
        type: "HARDWARE_ORDER",
        title: "New order received",
        message: `${orderItems.length} item${
          orderItems.length > 1 ? "s" : ""
        } — ${totalCost} LKR. Check the Orders tab.`,
        data: { jobId: job._id, requestId: request._id },
        actionUrl: "/(hardwareShop)/(tabs)/orders",
      });
    } catch (e) {
      // non-fatal
    }

    res.status(201).json({ success: true, data: { request, job } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get hardware requests
// @route   GET /api/hardware/requests
// @access  Private
exports.getHardwareRequests = async (req, res) => {
  try {
    let query = {};

    if (req.userType === "worker") {
      query.workerId = req.user._id;
    } else if (req.userType === "customer") {
      query.customerId = req.user._id;
    }

    const requests = await HardwareRequest.find(query)
      .populate("jobId", "serviceType status")
      .populate("workerId", "name phone")
      .populate("customerId", "name phone")
      .populate("shopId", "shopName phone address city")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get single hardware request
// @route   GET /api/hardware/requests/:id
// @access  Private
exports.getHardwareRequest = async (req, res) => {
  try {
    const request = await HardwareRequest.findById(req.params.id)
      .populate("jobId", "serviceType status")
      .populate("workerId", "name phone category")
      .populate("customerId", "name phone");

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Hardware request not found",
      });
    }

    // Check authorization
    if (
      (req.userType === "customer" &&
        request.customerId._id.toString() !== req.user._id.toString()) ||
      (req.userType === "worker" &&
        request.workerId._id.toString() !== req.user._id.toString())
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update hardware request status (approve/reject)
// @route   PUT /api/hardware/requests/:id/status
// @access  Private (Customer only)
exports.updateRequestStatus = async (req, res) => {
  try {
    const request = await HardwareRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Hardware request not found",
      });
    }

    if (request.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    request.status = req.body.status;

    if (req.body.status === "approved") {
      request.approvedAt = new Date();

      // Update job hardware cost
      const job = await Job.findById(request.jobId);
      if (job) {
        job.pricing.hardwareCost = request.totalCost;
        await job.save();
      }
    }

    await request.save();

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Mark hardware as delivered
// @route   PUT /api/hardware/requests/:id/delivered
// @access  Private (Worker only)
exports.markAsDelivered = async (req, res) => {
  try {
    const request = await HardwareRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Hardware request not found",
      });
    }

    if (request.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    if (request.status !== "approved") {
      return res.status(400).json({
        success: false,
        message: "Can only mark approved requests as delivered",
      });
    }

    request.status = "delivered";
    request.deliveredAt = new Date();
    await request.save();

    res.status(200).json({
      success: true,
      data: request,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ADMIN ENDPOINTS FOR HARDWARE MANAGEMENT

// @desc    Get all hardware items (including out of stock) - Admin only
// @route   GET /api/hardware/admin/items
// @access  Private (Admin only)
exports.getAdminHardwareItems = async (req, res) => {
  try {
    const { category, search } = req.query;

    let query = {};

    if (category) {
      query.category = category;
    }

    if (search) {
      query.name = { $regex: search, $options: "i" };
    }

    const items = await HardwareItem.find(query).sort("name");

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

// @desc    Create hardware item - Admin only
// @route   POST /api/hardware/admin/items
// @access  Private (Admin only)
exports.createHardwareItem = async (req, res) => {
  try {
    const { name, category, price, unit, description, image } = req.body;

    // Validate required fields
    if (!name || !category || price === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, category, and price",
      });
    }

    const item = await HardwareItem.create({
      name,
      category,
      price,
      unit: unit || "piece",
      description,
      image,
      inStock: true,
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

// @desc    Update hardware item - Admin only
// @route   PUT /api/hardware/admin/items/:id
// @access  Private (Admin only)
exports.updateHardwareItem = async (req, res) => {
  try {
    const { name, category, price, unit, description, image, inStock } =
      req.body;

    let item = await HardwareItem.findById(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Hardware item not found",
      });
    }

    // Update fields if provided
    if (name) item.name = name;
    if (category) item.category = category;
    if (price !== undefined) item.price = price;
    if (unit) item.unit = unit;
    if (description) item.description = description;
    if (image) item.image = image;
    if (inStock !== undefined) item.inStock = inStock;

    item = await item.save();

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

// @desc    Delete hardware item - Admin only
// @route   DELETE /api/hardware/admin/items/:id
// @access  Private (Admin only)
exports.deleteHardwareItem = async (req, res) => {
  try {
    const item = await HardwareItem.findByIdAndDelete(req.params.id);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Hardware item not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Hardware item deleted",
      data: item,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update hardware item stock status - Admin only
// @route   PUT /api/hardware/admin/items/:id/stock
// @access  Private (Admin only)
exports.updateHardwareStock = async (req, res) => {
  try {
    const { inStock } = req.body;

    if (inStock === undefined) {
      return res.status(400).json({
        success: false,
        message: "Please provide inStock status",
      });
    }

    const item = await HardwareItem.findByIdAndUpdate(
      req.params.id,
      { inStock },
      { new: true, runValidators: true },
    );

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Hardware item not found",
      });
    }

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

// @desc    Get all hardware requests - Admin can see all
// @route   GET /api/hardware/admin/requests
// @access  Private (Admin only)
exports.getAdminHardwareRequests = async (req, res) => {
  try {
    const { status, workerId, customerId } = req.query;

    let query = {};

    if (status) {
      query.status = status;
    }

    if (workerId) {
      query.workerId = workerId;
    }

    if (customerId) {
      query.customerId = customerId;
    }

    const requests = await HardwareRequest.find(query)
      .populate("jobId", "serviceType status")
      .populate("workerId", "name phone category")
      .populate("customerId", "name phone")
      .sort("-createdAt");

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
