const { db } = require("../firebase/adminConfig");
const { sendEmail } = require("./emailService");
const { sendSMS } = require("./smsService");
const { sendPush } = require("./pushService");

// SMS_ENABLED flag — set to "true" in .env to enable SMS sending.
// Currently disabled due to NZ carrier registration requirements blocking delivery.
// Flip to "true" before showcasing to demonstrate the Vonage integration in logs.
const SMS_ENABLED = process.env.SMS_ENABLED === "true";

// ---------------------------------------------------------------------------
// Builds the { subject, message } for each supported notification type.
// Add new types here as they come up (e.g. "invoiceReady").
// ---------------------------------------------------------------------------
function buildServiceDueContent(vehicle, customer) {
  // Guard: do not send if no service date has been set on the vehicle.
  // Only relevant for this type — "carReady" doesn't need a service date.
  if (!vehicle.nextServiceDate) {
    throw new Error(
      "No service date set for this vehicle. Please set a service date before sending a reminder."
    );
  }

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

  return { subject: "Vehicle Service Reminder", message };
}

function buildCarReadyContent(vehicle, customer) {
  const message =
    `Hi ${customer.firstName}, your ${vehicle.year} ${vehicle.make} ` +
    `${vehicle.model} (Rego: ${vehicle.rego}) is ready for pickup! ` +
    `Please contact us or log in to the customer portal for more details.`;

  return { subject: "Your Vehicle Is Ready", message };
}

const CONTENT_BUILDERS = {
  serviceDue: buildServiceDueContent,
  carReady: buildCarReadyContent,
};

// type: "serviceDue" | "carReady" — defaults to "serviceDue" so any existing
// callers that don't pass a type keep behaving exactly as before.
async function sendReminder(vehicle, customer, type = "serviceDue") {
  const buildContent = CONTENT_BUILDERS[type];
  if (!buildContent) {
    throw new Error(`Unknown notification type: "${type}".`);
  }

  const { subject, message } = buildContent(vehicle, customer);

  // Default to empty object if notificationPreferences is missing
  const prefs = customer.notificationPreferences || {};
  const deliveryStatus = {};

  // Email — only attempted if customer has email notifications enabled
  if (prefs.email) {
    try {
      await sendEmail(customer.email, subject, message);
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
    type,
    message,
    sentAt: new Date(),
    read: false,
    deliveryStatus,
  });

  return deliveryStatus;
}

module.exports = { sendReminder };