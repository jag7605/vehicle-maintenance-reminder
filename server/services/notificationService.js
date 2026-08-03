const { db } = require("../firebase/adminConfig");
const { sendEmail } = require("./emailService");
const { sendSMS } = require("./smsService");
const { sendPush } = require("./pushService");

// SMS_ENABLED flag — set to "true" in .env to enable SMS sending.
// Currently disabled due to NZ carrier registration requirements blocking delivery.
// Flip to "true" before showcasing to demonstrate the Vonage integration in logs.
const SMS_ENABLED = process.env.SMS_ENABLED === "true";


// Small server-side equivalent of the client's isPastDate() — compares by
// calendar day, not time-of-day, consistent with the client version.
function isPastDate(dateObj) {
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return startOfDay(dateObj) < startOfDay(new Date());
}

function buildWofDueContent(vehicle, customer) {
  if (!vehicle.nextWofDate) {
    throw new Error(
      "No WoF due date set for this vehicle. Please set a WoF date before sending a reminder."
    );
  }

  const dateObj = vehicle.nextWofDate.toDate();
  const date = dateObj.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const message = isPastDate(dateObj)
    ? `Hi ${customer.firstName}, your ${vehicle.year} ${vehicle.make} ` +
      `${vehicle.model} (Rego: ${vehicle.rego}) was due for a WoF on ` +
      `${date} and is now overdue. Please contact us or log in to the customer portal to book an appointment as soon as possible.`
    : `Hi ${customer.firstName}, your ${vehicle.year} ${vehicle.make} ` +
      `${vehicle.model} (Rego: ${vehicle.rego}) is due for a WoF on ` +
      `${date}. Contact us or log in to the customer portal to book an appointment.`;

  return { subject: isPastDate(dateObj) ? "WoF Overdue" : "WoF Reminder", message };
}

function buildOilChangeDueContent(vehicle, customer) {
  if (!vehicle.nextOilChangeDate) {
    throw new Error(
      "No Oil Change due date set for this vehicle. Please set an Oil Change date before sending a reminder."
    );
  }

  const dateObj = vehicle.nextOilChangeDate.toDate();
  const date = dateObj.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const message = isPastDate(dateObj)
    ? `Hi ${customer.firstName}, your ${vehicle.year} ${vehicle.make} ` +
      `${vehicle.model} (Rego: ${vehicle.rego}) was due for an Oil Change on ` +
      `${date} and is now overdue. Please contact us or log in to the customer portal to book an appointment as soon as possible.`
    : `Hi ${customer.firstName}, your ${vehicle.year} ${vehicle.make} ` +
      `${vehicle.model} (Rego: ${vehicle.rego}) is due for an Oil Change on ` +
      `${date}. Contact us or log in to the customer portal to book an appointment.`;

  return { subject: isPastDate(dateObj) ? "Oil Change Overdue" : "Oil Change Reminder", message };
}

function buildCarReadyContent(vehicle, customer) {
  const message =
    `Hi ${customer.firstName}, your ${vehicle.year} ${vehicle.make} ` +
    `${vehicle.model} (Rego: ${vehicle.rego}) is ready for pickup! ` +
    `Please contact us or log in to the customer portal for more details.`;

  return { subject: "Your Vehicle Is Ready", message };
}

const CONTENT_BUILDERS = {
  wofDue: buildWofDueContent,
  oilChangeDue: buildOilChangeDueContent,
  carReady: buildCarReadyContent,
};

// ---------------------------------------------------------------------------
// Builds the { subject, message } for each supported BOOKING status.
// Takes (appointment, vehicle, customer) — appointment.date is a Firestore Timestamp
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

// ---------------------------------------------------------------------------
// buildCompletedContent — extended in Sprint 5 (Person C initially, revised
// during Person D's integration to support multiple service types per
// appointment).
//
// nextDueDates is an array of { serviceType, date } entries — one per
// service type on the appointment that has a calculated next-due date
// (WoF and/or Oil Change). Pass an empty array if none apply (General
// Service, Brake Check, Tyre Check carry no lead time).
//
// This function does NOT calculate any dates itself — the caller
// (job completion orchestration) decides which service types apply and
// passes the already-calculated results in.
// ---------------------------------------------------------------------------
function buildCompletedContent(appointment, vehicle, customer, nextDueDates = []) {
  const baseMessage =
    `Hi ${customer.firstName}, the service for your ${vehicle.year} ${vehicle.make} ` +
    `${vehicle.model} (Rego: ${vehicle.rego}) has been completed. Thank you for choosing us.`;

  if (!nextDueDates || nextDueDates.length === 0) {
    return { subject: "Service Completed", message: baseMessage };
  }

  const dueWordingLines = nextDueDates.map(({ serviceType, date }) => {
    const dateObj = date.toDate ? date.toDate() : date;
    const formattedDate = dateObj.toLocaleDateString("en-NZ", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    if (serviceType === "WOF") {
      return `Your next WoF is due by ${formattedDate}.`;
    }
    if (serviceType === "Oil Change") {
      return `Your next Oil Change is due by ${formattedDate}.`;
    }
    return `Your next ${serviceType} is due around ${formattedDate}.`;
  });

  const message = `${baseMessage} ${dueWordingLines.join(" ")}`;

  return { subject: "Service Completed", message };
}

const BOOKING_CONTENT_BUILDERS = {
  confirmed: buildConfirmedContent,
  rejected: buildRejectedContent,
  completed: buildCompletedContent,
};

// Shared helper — formats appointment.date (Firestore Timestamp)
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
// sendBookingNotification — Sprint 4, Step 1. Extended in Sprint 5 (Person C)
// with a nextDueDate parameter (defaults to null) so existing "confirmed"/
// "rejected" call sites, which will never pass one, keep working unchanged.
// status must be one of: "confirmed" | "rejected" | "completed"
// Same channel/preference/deliveryStatus pattern as sendReminder.
// ---------------------------------------------------------------------------
async function sendBookingNotification(appointment, vehicle, customer, status, nextDueDates = null) {
  const buildContent = BOOKING_CONTENT_BUILDERS[status];
  if (!buildContent) {
    throw new Error(`Unknown booking status: "${status}".`);
  }

  // nextDueDates is only meaningful for "completed" — buildConfirmedContent
  // and buildRejectedContent simply ignore the extra argument.
  const { subject, message } = buildContent(appointment, vehicle, customer, nextDueDates);

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