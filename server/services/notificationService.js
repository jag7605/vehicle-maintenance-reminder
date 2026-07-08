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

async function sendReminder(vehicle, customer, type = "serviceDue") {
  const buildContent = CONTENT_BUILDERS[type];
  if (!buildContent) {
    throw new Error(`Unknown notification type: "${type}".`);
  }

  const { subject, message } = buildContent(vehicle, customer);

  const prefs = customer.notificationPreferences || {};
  const deliveryStatus = {};

  // Email — only attempted if customer has email notifications enabled
  if (prefs.email) {
    try {
      await sendEmail(customer.email, subject, message);
      deliveryStatus.email = "sent";
    } catch (err) {
      console.error(`[notificationService] Email failed for customer ${customer.id}:`, err);
      deliveryStatus.email = "failed";
    }
  }

  // SMS — skipped entirely if SMS_ENABLED is false, no Vonage credit consumed.
  if (prefs.sms && SMS_ENABLED) {
    try {
      await sendSMS(customer.phone, message);
      deliveryStatus.sms = "sent";
    } catch (err) {
      console.error(`[notificationService] SMS failed for customer ${customer.id}:`, err);
      deliveryStatus.sms = "failed";
    }
  }

  // Browser push — only attempted if customer has browser notifications enabled
  if (prefs.browser) {
    if (!customer.pushSubscription) {
      // No point calling sendPush at all without a subscription — log a
      // clearer reason than a generic webpush error would give.
      console.error(
        `[notificationService] Browser push skipped for customer ${customer.id}: no pushSubscription saved.`
      );
      deliveryStatus.browser = "failed";
    } else {
      try {
        await sendPush(customer.pushSubscription, message);
        deliveryStatus.browser = "sent";
      } catch (err) {
        // This is the log to watch — statusCode 404/410 means the
        // subscription is stale/expired; 401/403 usually means a VAPID
        // key mismatch between frontend and backend.
        console.error(
          `[notificationService] Push failed for customer ${customer.id}:`,
          err.statusCode ? `status ${err.statusCode} — ${err.body || err.message}` : err
        );
        deliveryStatus.browser = "failed";
      }
    }
  }

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