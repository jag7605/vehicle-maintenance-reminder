const cron = require("node-cron");
const { db } = require("../firebase/adminConfig");
const { sendReminder } = require("../services/notificationService");

// Runs one field's 7-day/1-day reminder pass. fieldName is the vehicle
// field to query ("nextWofDate" or "nextOilChangeDate"), reminderType is
// the sendReminder() type to send when a match is found ("wofDue" or
// "oilChangeDue").
async function runReminderPassForField(fieldName, reminderType) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sevenDaysOut = new Date(today);
  sevenDaysOut.setDate(today.getDate() + 7);

  const oneDayOut = new Date(today);
  oneDayOut.setDate(today.getDate() + 1);

  const { Timestamp } = require("firebase-admin/firestore");
  const sevenDaysStart = Timestamp.fromDate(sevenDaysOut);
  const sevenDaysEnd = Timestamp.fromDate(new Date(sevenDaysOut.getTime() + 24 * 60 * 60 * 1000));
  const oneDayStart = Timestamp.fromDate(oneDayOut);
  const oneDayEnd = Timestamp.fromDate(new Date(oneDayOut.getTime() + 24 * 60 * 60 * 1000));

  const sevenDaySnapshot = await db.collection("vehicles")
    .where(fieldName, ">=", sevenDaysStart)
    .where(fieldName, "<", sevenDaysEnd)
    .get();

  const oneDaySnapshot = await db.collection("vehicles")
    .where(fieldName, ">=", oneDayStart)
    .where(fieldName, "<", oneDayEnd)
    .get();

  const vehicleDocs = [...sevenDaySnapshot.docs, ...oneDaySnapshot.docs];

  for (const vehicleDoc of vehicleDocs) {
    const vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() };

    try {
      const customerDoc = await db.collection("users").doc(vehicle.ownerId).get();
      if (!customerDoc.exists) {
        console.error(`Customer not found for vehicle ${vehicle.id}`);
        continue;
      }
      const customer = { id: customerDoc.id, ...customerDoc.data() };

      await sendReminder(vehicle, customer, reminderType);
      console.log(`${reminderType} reminder sent for vehicle ${vehicle.id} (owner: ${customer.firstName} ${customer.lastName})`);
    } catch (err) {
      console.error(`Failed to send ${reminderType} reminder for vehicle ${vehicle.id}:`, err.message);
    }
  }
}

async function runScheduledReminders() {
  await runReminderPassForField("nextWofDate", "wofDue");
  await runReminderPassForField("nextOilChangeDate", "oilChangeDue");
}

// Schedule the job to run daily at 10am
// Cron format: second(optional) minute hour day month weekday
function startScheduledReminders() {
  cron.schedule("0 10 * * *", async () => {
    console.log("Running scheduled reminders job...");
    try {
      await runScheduledReminders();
      console.log("Scheduled reminders job complete.");
    } catch (err) {
      console.error("Scheduled reminders job failed:", err.message);
    }
  });
}

module.exports = { startScheduledReminders, runScheduledReminders };