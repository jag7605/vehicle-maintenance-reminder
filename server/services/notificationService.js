const { db } = require("../firebase/adminConfig");
const { sendEmail } = require("./emailService");
const { sendSMS } = require("./smsService");
const { sendPush } = require("./pushService");

async function sendReminder(vehicle, customer) {
  // Guard: do not send if no service date has been set on the vehicle
  if (!vehicle.nextServiceDate) {
    throw new Error(
      "No service date set for this vehicle. Please set a service date before sending a reminder."
    );
  }

  // Format the service date from Firestore Timestamp to a readable string
  const serviceDate = vehicle.nextServiceDate.toDate().toDateString();

  const message =
    `Hi ${customer.firstName}, your ${vehicle.year} ${vehicle.make} ` +
    `${vehicle.model} (Rego: ${vehicle.rego}) is due for a service on ` +
    `${serviceDate}. Contact us or log in to the customer portal to book an appointment.`;

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

  // SMS — only attempted if customer has SMS notifications enabled
  if (prefs.sms) {
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