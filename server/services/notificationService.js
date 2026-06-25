const { db } = require("../firebase/adminConfig");
const { sendEmail } = require("./emailService");
const { sendSMS } = require("./smsService");
const { sendPush } = require("./pushService");

// SMS_ENABLED flag — set to "true" in .env to enable SMS sending.
// Currently disabled due to NZ carrier registration requirements blocking delivery.
// Flip to "true" before showcasing to demonstrate the Vonage integration in logs.
const SMS_ENABLED = process.env.SMS_ENABLED === "true";

async function sendReminder(vehicle, customer) {
  // Guard: do not send if no service date has been set on the vehicle
  if (!vehicle.nextServiceDate) {
    throw new Error(
      "No service date set for this vehicle. Please set a service date before sending a reminder."
    );
  }

  // Format the service date and time from the Firestore Timestamp
  const serviceDateObj = vehicle.nextServiceDate.toDate();
  const serviceDate = serviceDateObj.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const serviceTime = serviceDateObj.toLocaleTimeString("en-NZ", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const message =
    `Hi ${customer.firstName}, your ${vehicle.year} ${vehicle.make} ` +
    `${vehicle.model} (Rego: ${vehicle.rego}) is due for a service on ` +
    `${serviceDate} at ${serviceTime}. Contact us or log in to the customer portal to book an appointment.`;

  // Default to empty object if notificationPreferences is missing
  const prefs = customer.notificationPreferences || {};
  const deliveryStatus = {};

  // Email — only attempted if customer has email notifications enabled
  if (prefs.email) {
    try {
      await sendEmail(customer.email, "Vehicle Service Reminder", message);
      deliveryStatus.email = "sent";
    } catch {
      deliveryStatus.email = "failed";
    }
  }

  // SMS — skipped entirely if SMS_ENABLED is false, no Vonage credit consumed.
  // To enable: set SMS_ENABLED=true in .env and restart the server.
  if (prefs.sms && SMS_ENABLED) {
    try {
      await sendSMS(customer.phone, message);
      deliveryStatus.sms = "sent";
    } catch {
      deliveryStatus.sms = "failed";
    }
  }

  // Browser push — only attempted if customer has browser notifications enabled
  // pushSubscription will be absent until the frontend pair stores it in Week 2,
  // so this will record "failed" during Week 1 testing — that is expected
  if (prefs.browser) {
    try {
      await sendPush(customer.pushSubscription, message);
      deliveryStatus.browser = "sent";
    } catch {
      deliveryStatus.browser = "failed";
    }
  }

  // Write the notification record to Firestore
  await db.collection("notifications").add({
    customerId: customer.id,
    vehicleId: vehicle.id,
    message,
    sentAt: new Date(),
    read: false,
    deliveryStatus,
  });

  return deliveryStatus;
}

module.exports = { sendReminder };