require("dotenv").config();
// TEMPORARY TEST SCRIPT — delete after confirming this works.
// Run from inside the server/ folder. The server does NOT need to be
// running for this one — unlike testAppointments.js, this calls functions
// directly (no HTTP endpoint calls yours yet — that's Person D's job).
// Run with: node testOilChangeCompletion.js

const { db } = require("../firebase/adminConfig");
const { sendBookingNotification } = require("../services/notificationService");
const { calculateNextOilChangeDate } = require("../utils/oilChangeCalculator");

// Reused from testReminder.js / testAppointments.js — same real customer.
const CUSTOMER_ID = "5cnbF1Wvv7ZPexVCxUGyIchGPQA2";

let tempAppointmentIds = [];

// -----------------------------------------------------------------------
// Part 1: Unit test the calculator — no Firestore needed for this part.
// -----------------------------------------------------------------------
function testCalculator() {
  console.log("\n--- Testing calculateNextOilChangeDate ---");

  const completionDate = new Date("2026-07-31T10:00:00");
  const result = calculateNextOilChangeDate(completionDate);
  const resultDate = result.toDate();

  console.log("Completion date:", completionDate.toDateString());
  console.log("Calculated next due date:", resultDate.toDateString());

  // Build the expected date the same way the calculator should — 6 months
  // after completionDate — so this check works no matter what date is used
  // above, instead of only matching one hardcoded example.
  const expected = new Date(completionDate);
  expected.setMonth(expected.getMonth() + 6);

  const isTimestamp = typeof result.toDate === "function";
  const monthCorrect = resultDate.getMonth() === expected.getMonth();
  const yearCorrect = resultDate.getFullYear() === expected.getFullYear();
  const dayCorrect = resultDate.getDate() === expected.getDate();

  if (isTimestamp && monthCorrect && yearCorrect && dayCorrect) {
    console.log("PASS: returned a Timestamp, exactly 6 months after completion date.");
  } else {
    console.error("FAIL: check output type/date math.", {
      isTimestamp,
      monthCorrect,
      yearCorrect,
      dayCorrect,
    });
  }

  // Edge case: invalid input should throw, not silently produce garbage.
  try {
    calculateNextOilChangeDate("not-a-date");
    console.error("FAIL: expected an error for invalid input, but none was thrown.");
  } catch (err) {
    console.log("PASS: invalid input correctly throws an error:", err.message);
  }
}

// -----------------------------------------------------------------------
// Part 2: Test buildCompletedContent's branching, indirectly, via
// sendBookingNotification — then read the saved message back from the
// notifications collection to see the exact text that was generated.
// -----------------------------------------------------------------------
async function fetchCustomerAndVehicle() {
  const customerSnap = await db.collection("users").doc(CUSTOMER_ID).get();
  if (!customerSnap.exists) {
    throw new Error("Customer document not found. Check CUSTOMER_ID.");
  }
  const customer = { id: customerSnap.id, ...customerSnap.data() };
  console.log("\nCustomer fetched:", customer.firstName, customer.lastName);

  const vehicleSnap = await db
    .collection("vehicles")
    .where("ownerId", "==", CUSTOMER_ID)
    .limit(1)
    .get();

  if (vehicleSnap.empty) {
    throw new Error(`No vehicle found with ownerId == "${CUSTOMER_ID}".`);
  }
  const vehicleDoc = vehicleSnap.docs[0];
  const vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() };
  console.log("Vehicle found:", vehicle.year, vehicle.make, vehicle.model, `(${vehicle.id})`);

  return { customer, vehicle };
}

async function createTempAppointment(customerId, vehicleId, serviceType) {
  const docRef = await db.collection("appointments").add({
    customerId,
    vehicleId,
    date: new Date(),
    status: "confirmed",
    serviceType,
  });
  tempAppointmentIds.push(docRef.id);
  return { id: docRef.id, customerId, vehicleId, date: new Date(), status: "confirmed", serviceType };
}

async function getLatestNotificationMessage(appointmentId) {
  const snapshot = await db
    .collection("notifications")
    .where("appointmentId", "==", appointmentId)
    .orderBy("sentAt", "desc")
    .limit(1)
    .get();

  if (snapshot.empty) {
    throw new Error(`No notification document found for appointmentId ${appointmentId}.`);
  }
  return snapshot.docs[0].data();
}

async function testWithoutNextDueDate(customer, vehicle) {
  console.log("\n--- Test: completed status, NO nextDueDate (e.g. General Service) ---");
  const appointment = await createTempAppointment(customer.id, vehicle.id, "General Service");

  const deliveryStatus = await sendBookingNotification(appointment, vehicle, customer, "completed");
  console.log("deliveryStatus:", deliveryStatus);

  const notif = await getLatestNotificationMessage(appointment.id);
  console.log("Saved message:", notif.message);

  if (!notif.message.includes("next service is due")) {
    console.log("PASS: no next-due wording present, as expected for General Service.");
  } else {
    console.error("FAIL: expected plain completion message, but next-due wording was included.");
  }
}

async function testWithNextDueDate(customer, vehicle) {
  console.log("\n--- Test: completed status, WITH nextDueDate (e.g. Oil Change) ---");
  const appointment = await createTempAppointment(customer.id, vehicle.id, "Oil Change");

  const completionDate = new Date(); // simulates "admin marks complete right now"
  const nextDueDate = calculateNextOilChangeDate(completionDate);

  const deliveryStatus = await sendBookingNotification(
    appointment,
    vehicle,
    customer,
    "completed",
    nextDueDate
  );
  console.log("deliveryStatus:", deliveryStatus);

  const notif = await getLatestNotificationMessage(appointment.id);
  console.log("Saved message:", notif.message);

  if (notif.message.includes("Oil Change is due")) {
    console.log("PASS: Oil-Change-specific next-due wording correctly included.");
  } else {
    console.error("FAIL: expected Oil Change next-due wording, but it was missing.");
  }
}

async function cleanup() {
  for (const id of tempAppointmentIds) {
    await db.collection("appointments").doc(id).delete();
  }
  console.log(`\nCleaned up ${tempAppointmentIds.length} temp appointment(s).`);
}

async function runTests() {
  try {
    testCalculator();

    const { customer, vehicle } = await fetchCustomerAndVehicle();
    await testWithoutNextDueDate(customer, vehicle);
    await testWithNextDueDate(customer, vehicle);
  } catch (err) {
    console.error("\nTest run failed:", err.message);
  } finally {
    await cleanup();
    process.exit(0);
  }
}

runTests();