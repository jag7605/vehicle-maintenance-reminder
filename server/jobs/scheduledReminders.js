const cron = require("node-cron");
const { db } = require("../firebase/adminConfig");
const { sendReminder } = require("../services/notificationService");

async function runScheduledReminders() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate the two target dates — exactly 7 days and exactly 1 day from today
  const sevenDaysOut = new Date(today);
  sevenDaysOut.setDate(today.getDate() + 7);

  const oneDayOut = new Date(today);
  oneDayOut.setDate(today.getDate() + 1);

  // Convert to Firestore Timestamps for comparison
  const { Timestamp } = require("firebase-admin/firestore");
  const sevenDaysStart = Timestamp.fromDate(sevenDaysOut);
  const sevenDaysEnd = Timestamp.fromDate(new Date(sevenDaysOut.getTime() + 24 * 60 * 60 * 1000));
  const oneDayStart = Timestamp.fromDate(oneDayOut);
  const oneDayEnd = Timestamp.fromDate(new Date(oneDayOut.getTime() + 24 * 60 * 60 * 1000));

  // Query vehicles due exactly 7 days from today
  const sevenDaySnapshot = await db.collection("vehicles")
    .where("nextServiceDate", ">=", sevenDaysStart)
    .where("nextServiceDate", "<", sevenDaysEnd)
    .get();

  // Query vehicles due exactly 1 day from today
  const oneDaySnapshot = await db.collection("vehicles")
    .where("nextServiceDate", ">=", oneDayStart)
    .where("nextServiceDate", "<", oneDayEnd)
    .get();

  // Combine both result sets into one list
  const vehicleDocs = [...sevenDaySnapshot.docs, ...oneDaySnapshot.docs];

  for (const vehicleDoc of vehicleDocs) {
    const vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() };

    try {
      // Fetch the customer who owns this vehicle
      const customerDoc = await db.collection("users").doc(vehicle.ownerId).get();
      if (!customerDoc.exists) {
        console.error(`Customer not found for vehicle ${vehicle.id}`);
        continue;
      }
      const customer = { id: customerDoc.id, ...customerDoc.data() };

      await sendReminder(vehicle, customer);
      console.log(`Reminder sent for vehicle ${vehicle.id} (owner: ${customer.firstName} ${customer.lastName})`);
    } catch (err) {
      console.error(`Failed to send reminder for vehicle ${vehicle.id}:`, err.message);
    }
  }
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