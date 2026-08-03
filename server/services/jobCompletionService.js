const { db } = require("../firebase/adminConfig");
const { Timestamp } = require("firebase-admin/firestore");
const { calculateNextWoFDate } = require("../utils/wofCalculator");
const { calculateNextOilChangeDate } = require("../utils/oilChangeCalculator");
const { sendBookingNotification } = require("./notificationService");

// ---------------------------------------------------------------------------
// runJobCompletion — Sprint 5 integration (Person D).
//
// Called after an appointment has already been updated to status
// "completed" (Person A's /complete endpoint does that write first). This
// function:
//   1. Determines every service type on the appointment (primary +
//      additionalServiceTypes, supporting multi-service bookings)
//   2. Calls the matching calculator (WoF / Oil Change) for any that apply
//   3. Updates vehicle.nextWofDate / vehicle.nextOilChangeDate in Firestore
//      for whichever calculators returned a date (skips writing a field if
//      its calculator returned null, e.g. a vehicle under 4 years old)
//   4. Sends the customer completion notification, including next-due
//      wording for every service type that had one
//
// completedServiceDate should be the real moment "mark complete" was
// clicked (new Date()) — not appointment.date — per Person C's flagged
// requirement, since the due-date calculators measure forward from the
// actual completion moment.
// ---------------------------------------------------------------------------
async function runJobCompletion(appointment, vehicle, customer, completedServiceDate) {
  const serviceTypes = [
    appointment.serviceType,
    ...(appointment.additionalServiceTypes || []),
  ].filter(Boolean);

  const vehicleUpdates = {};
  const nextDueDates = [];

  for (const serviceType of serviceTypes) {
    if (serviceType === "WOF") {
      const nextWofDate = calculateNextWoFDate(vehicle, completedServiceDate);
      if (nextWofDate) {
        vehicleUpdates.nextWofDate = Timestamp.fromDate(nextWofDate);
        nextDueDates.push({ serviceType: "WOF", date: nextWofDate });
      }
      // null means vehicle is under 4 years old — no WoF reminder, nothing
      // written, nothing mentioned in the notification.
    } else if (serviceType === "Oil Change") {
      const nextOilChangeDate = calculateNextOilChangeDate(completedServiceDate);
      vehicleUpdates.nextOilChangeDate = nextOilChangeDate;
      nextDueDates.push({ serviceType: "Oil Change", date: nextOilChangeDate });
    }
    // Any other service type (General Service, Brake Check, Tyre Check,
    // Other) carries no lead time — no calculation, nothing written.
  }

  if (Object.keys(vehicleUpdates).length > 0) {
    await db.collection("vehicles").doc(vehicle.id).update(vehicleUpdates);
  }

  const deliveryStatus = await sendBookingNotification(
    appointment,
    vehicle,
    customer,
    "completed",
    nextDueDates
  );

  return { vehicleUpdates, deliveryStatus };
}

module.exports = { runJobCompletion };