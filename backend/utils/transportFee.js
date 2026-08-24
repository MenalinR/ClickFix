const { HardwareRequest } = require("../models/Hardware");
const { getRoadDistanceKm } = require("./geocode");
const { getSettings } = require("../models/PlatformSettings");

// Snapshots the worker's starting position onto the job and computes a
// distance-based transport fee, folding it into pricing.totalAmount. Called
// the first time a job goes "On the way" — either heading straight to the
// customer, or first to a hardware shop then the customer.
//
// Mutates `job` in place but does NOT save it — callers already save the
// job right after their own status change, so this piggybacks on that.
// Never throws: distance lookups are best-effort, matching this codebase's
// existing geocode/directions conventions (see backend/utils/geocode.js).
async function applyTransportFee(job, workerCoords) {
  if (!job || job.travel?.computedAt) return; // already computed
  if (
    !Array.isArray(workerCoords) ||
    workerCoords.length !== 2 ||
    (workerCoords[0] === 0 && workerCoords[1] === 0)
  ) {
    return;
  }

  try {
    const hardwareRequest = await HardwareRequest.findOne({
      jobId: job._id,
      shopId: { $exists: true },
    }).populate("shopId", "location");

    const shopCoords = hardwareRequest?.shopId?.location?.coordinates;
    const customerCoords = job.location?.coordinates;
    if (!customerCoords) return;

    let distanceKm = null;
    let viaHardwareShop = false;

    if (Array.isArray(shopCoords) && shopCoords.length === 2) {
      const leg1 = await getRoadDistanceKm(workerCoords, shopCoords);
      const leg2 = await getRoadDistanceKm(shopCoords, customerCoords);
      if (leg1 != null && leg2 != null) {
        distanceKm = leg1 + leg2;
        viaHardwareShop = true;
      }
    } else {
      distanceKm = await getRoadDistanceKm(workerCoords, customerCoords);
    }

    if (distanceKm == null) return; // API unavailable — skip, no fee added

    const settings = await getSettings();
    const ratePerKm = settings.transportRatePerKm;
    const transportFee = Math.round(distanceKm * ratePerKm);

    job.pricing.transportFee = transportFee;
    job.pricing.totalAmount = (job.pricing.totalAmount || 0) + transportFee;
    job.travel = {
      workerStartLocation: { coordinates: workerCoords },
      viaHardwareShop,
      distanceKm,
      ratePerKm,
      computedAt: new Date(),
    };
  } catch {
    // Non-fatal — the job proceeds without a transport fee.
  }
}

module.exports = { applyTransportFee };
