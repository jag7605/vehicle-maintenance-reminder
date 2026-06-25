const express = require("express");
const cors = require("cors");
require("dotenv").config();
const remindersRouter = require("./routes/reminders");
const { startScheduledReminders } = require("./jobs/scheduledReminders");

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Health check — open http://localhost:5001/api/health to confirm it's working
app.get("/api/health", (req, res) => {
  res.json({ status: "Server is running" });
});

// Admin reminder routes — manual trigger endpoint lives here
app.use("/api/admin", remindersRouter);

// Start the daily scheduled reminders cron job
startScheduledReminders();

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});