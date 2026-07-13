const { db } = require("../firebase/adminConfig");
const { sendEmail } = require("./emailService");
const { sendSMS } = require("./smsService");
const { sendPush } = require("./pushService");

// SMS_ENABLED flag — set to "true" in .env to enable SMS sending.
// Currently disabled due to NZ carrier registration requirements blocking delivery.
// Flip to "true" before showcasing to demonstrate the Vonage integration in logs.
const SMS_ENABLED = process.env.SMS_ENABLED === "true";

// ---------------------------------------------------------------------------
// Builds the { subject, message } for each supported REMINDER type.
// Add new reminder types here as they come up (e.g. "invoiceReady").
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

// ---------------------------------------------------------------------------
// Builds the { subject, message } for each supported BOOKING status.
// Takes (appointment, vehicle, customer) — appointment.date is a Firestore
// Timestamp, same pattern as vehicle.nextServiceDate above.
// ---------------------------------------------------------------------------
function buildConfirmedContent(appointment, vehicle, customer) {
  const { date, time } = formatAppointmentDate(appointment);

  const message =
    `Hi ${customer.firstName}, your appointment for your ${vehicle.year} ${vehicle.make} ` +
    `${vehicle.model} (Rego: ${vehicle.rego}) on ${date} at ${time} has been confirmed. ` +
    `We look forward to seeing you.`;

  return { subject: "Appointment Confirmed", message };
}

function buildRejectedContent(appointment, vehicle, customer) {
  const { date, time } = formatAppointmentDate(appointment);

  const message =
    `Hi ${customer.firstName}, your appointment request for your ${vehicle.year} ${vehicle.make} ` +
    `${vehicle.model} (Rego: ${vehicle.rego}) on ${date} at ${time} has been rejected. ` +
    `Please contact us or log in to the portal to request a new time.`;

  return { subject: "Appointment Rejected", message };
}

function buildCompletedContent(appointment, vehicle, customer) {
  const message =
    `Hi ${customer.firstName}, the service for your ${vehicle.year} ${vehicle.make} ` +
    `${vehicle.model} (Rego: ${vehicle.rego}) has been completed. Thank you for choosing us.`;

  return { subject: "Service Completed", message };
}

const BOOKING_CONTENT_BUILDERS = {
  confirmed: buildConfirmedContent,
  rejected: buildRejectedContent,
  completed: buildCompletedContent,
};

// Shared helper — formats appointment.date (Firestore Timestamp) the same
// way vehicle.nextServiceDate is formatted above.
function formatAppointmentDate(appointment) {
  if (!appointment.date) {
    throw new Error("Appointment has no date set.");
  }

  const dateObj = appointment.date.toDate();
  const date = dateObj.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const time = dateObj.toLocaleTimeString("en-NZ", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return { date, time };
}

async function sendReminder(vehicle, customer, type = "serviceDue") {
  const buildContent = CONTENT_BUILDERS[type];
  if (!buildContent) {
    throw new Error(`Unknown notification type: "${type}".`);
  }

  const { subject, message } = buildContent(vehicle, customer);

  const prefs = customer.notificationPreferences || {};
  const deliveryStatus = {};

  if (prefs.email) {
    try {
      await sendEmail(customer.email, subject, message);
      deliveryStatus.email = "sent";
    } catch (err) {
      console.error(`[notificationService] Email failed for customer ${customer.id}:`, err);
      deliveryStatus.email = "failed";
    }
  }

  if (prefs.sms && SMS_ENABLED) {
    try {
      await sendSMS(customer.phone, message);
      deliveryStatus.sms = "sent";
    } catch (err) {
      console.error(`[notificationService] SMS failed for customer ${customer.id}:`, err);
      deliveryStatus.sms = "failed";
    }
  }

  if (prefs.browser) {
    if (!customer.pushSubscription) {
      console.error(
        `[notificationService] Browser push skipped for customer ${customer.id}: no pushSubscription saved.`
      );
      deliveryStatus.browser = "failed";
    } else {
      try {
        await sendPush(customer.pushSubscription, message);
        deliveryStatus.browser = "sent";
      } catch (err) {
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

// ---------------------------------------------------------------------------
// sendBookingNotification — Sprint 4, Step 1.
// status must be one of: "confirmed" | "rejected" | "completed"
// Same channel/preference/deliveryStatus pattern as sendReminder.
// ---------------------------------------------------------------------------
async function sendBookingNotification(appointment, vehicle, customer, status) {
  const buildContent = BOOKING_CONTENT_BUILDERS[status];
  if (!buildContent) {
    throw new Error(`Unknown booking status: "${status}".`);
  }

  const { subject, message } = buildContent(appointment, vehicle, customer);

  const prefs = customer.notificationPreferences || {};
  const deliveryStatus = {};

  if (prefs.email) {
    try {
      await sendEmail(customer.email, subject, message);
      deliveryStatus.email = "sent";
    } catch (err) {
      console.error(`[notificationService] Email failed for customer ${customer.id}:`, err);
      deliveryStatus.email = "failed";
    }
  }

  if (prefs.sms && SMS_ENABLED) {
    try {
      await sendSMS(customer.phone, message);
      deliveryStatus.sms = "sent";
    } catch (err) {
      console.error(`[notificationService] SMS failed for customer ${customer.id}:`, err);
      deliveryStatus.sms = "failed";
    }
  }

  if (prefs.browser) {
    if (!customer.pushSubscription) {
      console.error(
        `[notificationService] Browser push skipped for customer ${customer.id}: no pushSubscription saved.`
      );
      deliveryStatus.browser = "failed";
    } else {
      try {
        await sendPush(customer.pushSubscription, message);
        deliveryStatus.browser = "sent";
      } catch (err) {
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
    appointmentId: appointment.id,
    type: "booking",
    status,
    message,
    sentAt: new Date(),
    read: false,
    deliveryStatus,
  });

  return deliveryStatus;
}

module.exports = { sendReminder, sendBookingNotification };