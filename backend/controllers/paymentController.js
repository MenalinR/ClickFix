const crypto = require("crypto");
const { HardwareRequest } = require("../models/Hardware");
const Job = require("../models/Job");
const { createNotification } = require("./notificationController");

const md5 = (str) =>
  crypto.createHash("md5").update(str).digest("hex").toUpperCase();

// POST /api/payments/payhere/hash
// Body: { orderId, amount, currency? }
exports.generatePayhereHash = async (req, res) => {
  try {
    const { orderId, amount, currency = "LKR" } = req.body;
    if (!orderId || !amount) {
      return res
        .status(400)
        .json({ success: false, message: "orderId and amount are required" });
    }

    const merchantId = (process.env.PAYHERE_MERCHANT_ID || "").trim();
    const merchantSecret = (process.env.PAYHERE_MERCHANT_SECRET || "").trim();
    if (!merchantId || !merchantSecret) {
      return res
        .status(500)
        .json({ success: false, message: "PayHere not configured" });
    }

    const amountFormatted = parseFloat(amount).toFixed(2);
    const secretHash = md5(merchantSecret);
    const hash = md5(
      merchantId + orderId + amountFormatted + currency + secretHash,
    );

    return res.json({
      success: true,
      data: { hash, merchantId, amountFormatted, currency, orderId },
    });
  } catch (e) {
    return res
      .status(500)
      .json({ success: false, message: e.message || "Server error" });
  }
};

// GET /api/payments/payhere/debug  — sandbox debugging only
exports.payhereDebug = (req, res) => {
  const merchantId = process.env.PAYHERE_MERCHANT_ID || "";
  const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET || "";
  const secretTrimmed = merchantSecret.trim();
  const secretHash = md5(secretTrimmed);
  const testHash = md5(merchantId + "TEST-001" + "100.00" + "LKR" + secretHash);
  return res.json({
    merchantId,
    secretLength: merchantSecret.length,
    secretTrimmedLength: secretTrimmed.length,
    secretFirst4: secretTrimmed.slice(0, 4),
    secretLast4: secretTrimmed.slice(-4),
    secretMd5: secretHash,
    testHash,
  });
};

// POST /api/payments/payhere/notify  (called by PayHere server, no auth)
exports.payhereNotify = async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payment_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
    } = req.body;

    const merchantSecret = process.env.PAYHERE_MERCHANT_SECRET;
    const secretHash = md5(merchantSecret);
    const localHash = md5(
      merchant_id +
        order_id +
        payhere_amount +
        payhere_currency +
        status_code +
        secretHash,
    );

    if (localHash !== md5sig) {
      return res.status(400).send("Invalid signature");
    }

    // status_code 2 = success
    if (String(order_id).startsWith("JOBPAY-")) {
      const jobId = order_id.replace(/^JOBPAY-/, "");
      if (String(status_code) === "2") {
        const job = await Job.findByIdAndUpdate(
          jobId,
          {
            "payment.status": "completed",
            "payment.method": "online",
            "payment.paidAt": new Date(),
            "payment.transactionId": payment_id,
          },
          { new: true },
        );

        if (job?.workerId) {
          try {
            await createNotification({
              recipient: job.workerId,
              recipientModel: "Worker",
              type: "PAYMENT_RECEIVED",
              title: "Payment received",
              message: `You've been paid ${job.pricing.totalAmount} LKR for the ${job.serviceType} job.`,
              data: { jobId: job._id, amount: job.pricing.totalAmount },
              actionUrl: "/earnings",
            });
          } catch (e) {
            // non-fatal
          }

          const io = req.app.get("io");
          if (io) {
            io.to(`track:${job._id}`).emit("payment-received", {
              jobId: job._id.toString(),
              workerId: job.workerId.toString(),
              amount: job.pricing.totalAmount,
              method: job.payment.method,
              paidAt: job.payment.paidAt,
            });
          }
        }
      }
    } else if (String(status_code) === "2") {
      const requestId = order_id.replace(/^HW-/, "");
      await HardwareRequest.findByIdAndUpdate(requestId, {
        paymentStatus: "paid",
        paymentId: payment_id,
      });
    } else if (String(status_code) === "0") {
      const requestId = order_id.replace(/^HW-/, "");
      await HardwareRequest.findByIdAndUpdate(requestId, {
        paymentStatus: "failed",
      });
    }

    return res.send("OK");
  } catch (e) {
    console.error("PayHere notify error:", e);
    return res.status(500).send("Error");
  }
};
