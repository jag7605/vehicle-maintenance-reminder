const express = require("express");
const router = express.Router();
const { db } = require("../firebase/adminConfig");
const { sendReminder } = require("../services/notificationService");

// POST /api/admin/send-reminder/:vehicleId
// Manually triggers a reminder for a specific vehicle immediately.
// Body: { type: "serviceDue" | "carReady" } — defaults to "serviceDue" if
// omitted, so any existing callers that don't send a body keep working.
router.post("/send-reminder/:vehicleId", async (req, res) => {
  const { vehicleId } = req.params;
  const { type } = req.body || {};

  try {
    // Step 1: Fetch the vehicle document by ID
    const vehicleDoc = await db.collection("vehicles").doc(vehicleId).get();
    if (!vehicleDoc.exists) {
      return res.status(404).json({ error: "Vehicle not found." });
    }
    const vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() };

    // Step 2: Fetch the customer who owns this vehicle
    const customerDoc = await db.collection("users").doc(vehicle.ownerId).get();
    if (!customerDoc.exists) {
      return res.status(404).json({ error: "Customer not found." });
    }
    const customer = { id: customerDoc.id, ...customerDoc.data() };

    // Step 3: Send the reminder (branches on type) and return the delivery status
    const deliveryStatus = await sendReminder(vehicle, customer, type);
    return res.json({ success: true, deliveryStatus });
  } catch (err) {
    // Returns the actual error message (e.g. "No service date set for this vehicle...")
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;