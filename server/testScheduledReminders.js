require("dotenv").config();
const { runScheduledReminders } = require("./jobs/scheduledReminders");

async function test() {
  console.log("Running scheduled reminders test...");
  try {
    await runScheduledReminders();
    console.log("Test complete — check your email/browser push and Firestore notifications collection for results.");
  } catch (err) {
    console.error("Test failed:", err.message);
  }
  process.exit(0);
}

test();