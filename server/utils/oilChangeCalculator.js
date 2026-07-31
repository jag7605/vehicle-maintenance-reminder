const { Timestamp } = require("firebase-admin/firestore");

// Oil Change due-date calculator — Sprint 5, Story 7.
// Fixed 6-month cycle, no vehicle-age dependency (unlike WoF).
//
// Input: completionDate — a JS Date representing the moment the admin
// actually marks the job complete (NOT the appointment's scheduled date —
// confirmed with the team this should be the real completion timestamp).
//
// Output: a Firestore Timestamp, matching the existing convention used by
// vehicles.nextServiceDate, since that's the field this result is intended
// to feed into (confirmed against vehicles.nextServiceDate's stored format).
function calculateNextOilChangeDate(completionDate) {
  if (!(completionDate instanceof Date) || isNaN(completionDate.getTime())) {
    throw new Error("calculateNextOilChangeDate requires a valid JS Date as input.");
  }

  const nextDate = new Date(completionDate);
  nextDate.setMonth(nextDate.getMonth() + 6);

  return Timestamp.fromDate(nextDate);
}

module.exports = { calculateNextOilChangeDate };