const express = require("express");
const router = express.Router();
const { db } = require("../firebase/adminConfig");
const { sendBookingNotification } = require("../services/notificationService");
const {
  OPEN_HOUR,
  CLOSE_HOUR,
  SLOT_DURATION_MINUTES,
  CLOSED_DAYS_OF_WEEK,
} = require("../config/workingHours");

const VALID_STATUSES = ["confirmed", "rejected", "completed"];

// Appointment statuses that occupy a slot. "pending" blocks a slot (confirmed
// per Sprint 4 clarification) because it's an outstanding request the admin
// hasn't actioned yet — the time can't be double-booked while it's pending.
// "rejected"/"cancelled"/"completed" do not block, since they don't
// represent a currently-held slot.
const BLOCKING_STATUSES = ["pending", "confirmed"];

const DATE_PARAM_REGEX = /^\d{4}-\d{2}-\d{2}$/;

const { runJobCompletion } = require("../services/jobCompletionService");

// GET /api/admin/appointments/availability?date=YYYY-MM-DD
// Computed on the fly from workingHours.js + existing appointments —
// no "slots" Firestore collection (Sprint 4 decision #1).
router.get("/appointments/availability", async (req, res) => {
  const { date } = req.query;

  if (!date || !DATE_PARAM_REGEX.test(date)) {
    return res.status(400).json({ error: "Query param 'date' is required in YYYY-MM-DD format." });
  }

  // Parsed as server-local wall-clock time, same simplicity level as the
  // existing en-NZ display formatting elsewhere in the codebase (no explicit
  // timezone conversion library used).
  const dayStart = new Date(`${date}T00:00:00`);
  if (isNaN(dayStart.getTime())) {
    return res.status(400).json({ error: `Invalid date: "${date}".` });
  }
  const dayEnd = new Date(`${date}T23:59:59.999`);

  try {
    // Closed day (Sunday) — no slots to offer.
    if (CLOSED_DAYS_OF_WEEK.includes(dayStart.getDay())) {
      return res.json({ date, closed: true, slots: [] });
    }

    // Fetch existing appointments for this day that block a slot.
    const snapshot = await db
      .collection("appointments")
      .where("date", ">=", dayStart)
      .where("date", "<=", dayEnd)
      .where("status", "in", BLOCKING_STATUSES)
      .get();

    // Build a set of booked hours (e.g. "09") for quick lookup, since slots
    // are fixed 1-hour blocks (Sprint 4 clarification: fixed-length slots).
    const bookedHours = new Set(
      snapshot.docs.map((doc) => {
        const apptDate = doc.data().date.toDate();
        return apptDate.getHours();
      })
    );

    // Generate every slot between OPEN_HOUR and CLOSE_HOUR.
    const slots = [];
    for (let hour = OPEN_HOUR; hour < CLOSE_HOUR; hour += SLOT_DURATION_MINUTES / 60) {
      const label = `${String(hour).padStart(2, "0")}:00`;
      slots.push({ time: label, available: !bookedHours.has(hour) });
    }

    return res.json({ date, closed: false, slots });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// PATCH /api/admin/appointments/:appointmentId/status
// Admin-only. Updates an appointment's status and sends the matching
// booking notification (confirmed/rejected/completed) to the customer.
// Body: { status: "confirmed" | "rejected" | "completed" }
//
// NOTE: This generic endpoint is kept for "confirmed" and "rejected"
// transitions. Completion has its own dedicated endpoint below
// (PATCH /appointments/:appointmentId/complete) because completion carries
// extra requirements this generic one doesn't handle: server-side time-gating
// and accepting postServiceNotes (Sprint 5, Person A / Stories 1-3).
router.patch("/appointments/:appointmentId/status", async (req, res) => {
  const { appointmentId } = req.params;
  const { status } = req.body || {};

  // Validated up front (before any Firestore write) — sendBookingNotification
  // also throws on an invalid status, but only after the appointment doc
  // would already have been updated. Checking here avoids writing a bad
  // status to Firestore in the first place.
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      error: `Invalid status: "${status}". Must be one of ${VALID_STATUSES.join(", ")}.`,
    });
  }

  try {
    // Step 1: Fetch the appointment document
    const appointmentDoc = await db.collection("appointments").doc(appointmentId).get();
    if (!appointmentDoc.exists) {
      return res.status(404).json({ error: "Appointment not found." });
    }
    const appointment = { id: appointmentDoc.id, ...appointmentDoc.data() };

    // Step 2: Fetch the vehicle document separately — vehicle is not embedded
    // on the appointment object (Sprint 4 decision #3)
    const vehicleDoc = await db.collection("vehicles").doc(appointment.vehicleId).get();
    if (!vehicleDoc.exists) {
      return res.status(404).json({ error: "Vehicle not found." });
    }
    const vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() };

    // Step 3: Fetch the customer who booked this appointment
    const customerDoc = await db.collection("users").doc(appointment.customerId).get();
    if (!customerDoc.exists) {
      return res.status(404).json({ error: "Customer not found." });
    }
    const customer = { id: customerDoc.id, ...customerDoc.data() };

    // Step 4: Update the appointment's status in Firestore
    await db.collection("appointments").doc(appointmentId).update({ status });

    // Step 5: Send the booking notification for the new status
    const deliveryStatus = await sendBookingNotification(appointment, vehicle, customer, status);

    return res.json({ success: true, deliveryStatus });
  } catch (err) {
    // Returns the actual error message (e.g. "Unknown booking status...")
    return res.status(400).json({ error: err.message });
  }
});

// PATCH /api/admin/appointments/:appointmentId/complete
// Admin-only. Sprint 5, Person A — Stories 1, 2, 3.
//
// Dedicated completion endpoint, deliberately separate from the generic
// /status endpoint above. Completion has two extra requirements the generic
// endpoint doesn't handle:
//   1. Server-side time-gating — the appointment's booked date/time must
//      have actually passed. The frontend also disables the button, but
//      that's a UX nicety, not a safeguard: this endpoint could be called
//      directly, so the check has to happen here too.
//   2. Accepting postServiceNotes (free-text, admin-entered detail about
//      the work performed, e.g. "used synthetic oil") — a new field on the
//      appointment document, distinct from the customer's original booking
//      "notes" field (Sprint 5 decision #3).
//
// Scope boundary (confirm with Person D before merging): this endpoint's
// job stops at updating the appointment to status "completed" with the
// provided postServiceNotes. It does NOT calculate WoF/Oil Change next-due
// dates and does NOT send the customer completion notification — Person D
// owns wiring those in as part of the integration/orchestration step.
//
// Body: { postServiceNotes?: string }
router.patch("/appointments/:appointmentId/complete", async (req, res) => {
  const { appointmentId } = req.params;
  const { postServiceNotes } = req.body || {};

  // postServiceNotes is optional but must be a string if provided, since it
  // gets written straight to Firestore.
  if (postServiceNotes !== undefined && typeof postServiceNotes !== "string") {
    return res.status(400).json({ error: "postServiceNotes must be a string." });
  }

  try {
    // Step 1: Fetch the appointment document
    const appointmentRef = db.collection("appointments").doc(appointmentId);
    const appointmentDoc = await appointmentRef.get();

    if (!appointmentDoc.exists) {
      return res.status(404).json({ error: "Appointment not found." });
    }

    const appointment = { id: appointmentDoc.id, ...appointmentDoc.data() };

    // Step 2: Only a "confirmed" appointment can be completed. This blocks
    // completing a job that's still "pending" (never confirmed), already
    // "completed", "rejected", or "cancelled".
    if (appointment.status !== "confirmed") {
      return res.status(400).json({
        error: `Cannot complete an appointment with status "${appointment.status}". Only "confirmed" appointments can be marked complete.`,
      });
    }

    // Step 3: Server-side time-gate. Do not trust the frontend button being
    // disabled as the only safeguard — validate here too, since this
    // endpoint could be called directly. Gate is against the booked start
    // time (Sprint 5 decision #5 — "start of the slot, not end").
    const appointmentDate = appointment.date?.toDate
      ? appointment.date.toDate()
      : new Date(appointment.date);

    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({ error: "Appointment has an invalid date." });
    }

    const now = new Date();
    if (appointmentDate > now) {
      return res.status(400).json({
        error: "This appointment's scheduled time has not passed yet and cannot be marked complete.",
      });
    }

    // Step 4: Update the appointment — status -> "completed",
    // postServiceNotes -> the provided string (or "" if omitted).
    const updates = {
      status: "completed",
      postServiceNotes: postServiceNotes ?? "",
    };

    await appointmentRef.update(updates);

    const completedAppointment = { ...appointment, ...updates };

    // Step 5: Sprint 5 integration (Person D) — calculate next-due dates
    // for any WoF/Oil Change service types on this appointment, update the
    // vehicle document, and send the customer completion notification.
    // completedServiceDate is the real moment this endpoint runs (now),
    // not appointment.date — per Person C's flagged requirement.
    const vehicleDoc = await db.collection("vehicles").doc(appointment.vehicleId).get();
    if (!vehicleDoc.exists) {
      return res.status(404).json({ error: "Vehicle not found." });
    }
    const vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() };

    const customerDoc = await db.collection("users").doc(appointment.customerId).get();
    if (!customerDoc.exists) {
      return res.status(404).json({ error: "Customer not found." });
    }
    const customer = { id: customerDoc.id, ...customerDoc.data() };

    const { deliveryStatus } = await runJobCompletion(
      completedAppointment,
      vehicle,
      customer,
      now
    );

    return res.json({
      success: true,
      appointment: completedAppointment,
      deliveryStatus,
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

module.exports = router;