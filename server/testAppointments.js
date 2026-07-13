require("dotenv").config();
// TEMPORARY TEST SCRIPT — delete after confirming Steps 3-5 work.
// Run from inside the server/ folder, WITH THE SERVER ALREADY RUNNING
// (node index.js in another terminal), then: node testAppointments.js
//
// This script writes a test appointment directly to Firestore (there's no
// POST /appointments endpoint yet — creation is the frontend pair's Week 2
// task), then hits the real running server over HTTP to exercise:
//   - Step 4: GET /api/admin/appointments/availability
//   - Step 3: PATCH /api/admin/appointments/:appointmentId/status
// The test appointment is deleted via the Admin SDK at the end (the
// Firestore rules block client-side delete, but the Admin SDK bypasses
// rules, same as the rest of this script).

const { db } = require("./firebase/adminConfig");

const BASE_URL = `http://localhost:${process.env.PORT || 5001}`;

// Reused from testReminder.js — same real customer.
const CUSTOMER_ID = "5cnbF1Wvv7ZPexVCxUGyIchGPQA2";

// Finds the next occurrence of a given weekday (0=Sun...6=Sat) at a fixed
// hour, so the test always lands on a known open weekday/slot and never
// accidentally falls on today, in the past, or on Sunday.
function getNextWeekdayAt(targetDayOfWeek, hour) {
  const result = new Date();
  result.setHours(hour, 0, 0, 0);
  do {
    result.setDate(result.getDate() + 1);
  } while (result.getDay() !== targetDayOfWeek);
  return result;
}

// Builds a YYYY-MM-DD string from LOCAL date parts. toISOString() converts
// to UTC first, which shifts the date backwards in NZ (UTC+12) — e.g.
// 10:00 NZT on the 15th becomes 22:00 UTC on the 14th, producing the wrong
// date param. This keeps the date string aligned with the local time the
// appointment was actually created at.
function toLocalDateParam(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Next Wednesday at 10:00 — arbitrary weekday/hour, just needs to be a real
// open slot (9am-5pm, Mon-Sat) for the availability check to be meaningful.
const TEST_APPOINTMENT_DATE = getNextWeekdayAt(3, 10);
const TEST_DATE_PARAM = toLocalDateParam(TEST_APPOINTMENT_DATE);
const TEST_HOUR_LABEL = "10:00";

let testAppointmentId = null;

async function fetchCustomerAndVehicle() {
  const customerSnap = await db.collection("users").doc(CUSTOMER_ID).get();
  if (!customerSnap.exists) {
    throw new Error("Customer document not found. Check CUSTOMER_ID.");
  }
  const customer = { id: customerSnap.id, ...customerSnap.data() };
  console.log("Customer fetched:", customer.firstName, customer.lastName);

  // Use an existing vehicle already owned by this customer — the routes
  // fetch a real vehicle doc from Firestore, so this can't be a mock object
  // the way testReminder.js used one.
  const vehicleSnap = await db
    .collection("vehicles")
    .where("ownerId", "==", CUSTOMER_ID)
    .limit(1)
    .get();

  if (vehicleSnap.empty) {
    throw new Error(
      `No vehicle found with ownerId == "${CUSTOMER_ID}". Add a vehicle for this customer before running this test.`
    );
  }
  const vehicleDoc = vehicleSnap.docs[0];
  const vehicle = { id: vehicleDoc.id, ...vehicleDoc.data() };
  console.log("Vehicle found:", vehicle.year, vehicle.make, vehicle.model, `(${vehicle.id})`);

  return { customer, vehicle };
}

async function createTestAppointment(vehicleId) {
  const docRef = await db.collection("appointments").add({
    customerId: CUSTOMER_ID,
    vehicleId,
    date: TEST_APPOINTMENT_DATE,
    status: "pending",
  });
  testAppointmentId = docRef.id;
  console.log(`Test appointment created: ${testAppointmentId} at ${TEST_APPOINTMENT_DATE}`);
}

async function testAvailabilityShowsBooked() {
  console.log(`\n--- Step 4: GET /appointments/availability?date=${TEST_DATE_PARAM} ---`);
  const res = await fetch(`${BASE_URL}/api/admin/appointments/availability?date=${TEST_DATE_PARAM}`);
  const body = await res.json();
  console.log("Response:", JSON.stringify(body, null, 2));

  const slot = body.slots?.find((s) => s.time === TEST_HOUR_LABEL);
  if (!slot) {
    console.error(`FAIL: no ${TEST_HOUR_LABEL} slot found in response.`);
  } else if (slot.available !== false) {
    console.error(`FAIL: expected ${TEST_HOUR_LABEL} to be unavailable (pending appointment should block it).`);
  } else {
    console.log(`PASS: ${TEST_HOUR_LABEL} correctly shows as unavailable.`);
  }
}

async function testAvailabilityOnSunday() {
  const nextSunday = toLocalDateParam(getNextWeekdayAt(0, 10));
  console.log(`\n--- Step 4: GET /appointments/availability?date=${nextSunday} (Sunday, should be closed) ---`);
  const res = await fetch(`${BASE_URL}/api/admin/appointments/availability?date=${nextSunday}`);
  const body = await res.json();
  console.log("Response:", JSON.stringify(body, null, 2));

  if (body.closed !== true || body.slots.length !== 0) {
    console.error("FAIL: expected Sunday to be closed with no slots.");
  } else {
    console.log("PASS: Sunday correctly shows as closed with no slots.");
  }
}

async function testPatchStatusInvalid() {
  console.log(`\n--- Step 3: PATCH status with an invalid status (should be rejected) ---`);
  const res = await fetch(`${BASE_URL}/api/admin/appointments/${testAppointmentId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "not-a-real-status" }),
  });
  const body = await res.json();
  console.log("Status code:", res.status, "Response:", body);

  if (res.status === 400 && body.error) {
    console.log("PASS: invalid status correctly rejected with 400.");
  } else {
    console.error("FAIL: expected 400 with an error message for an invalid status.");
  }
}

async function testPatchStatusConfirmed() {
  console.log(`\n--- Step 3: PATCH status -> "confirmed" ---`);
  const res = await fetch(`${BASE_URL}/api/admin/appointments/${testAppointmentId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "confirmed" }),
  });
  const body = await res.json();
  console.log("Status code:", res.status, "Response:", body);

  if (res.status === 200 && body.success && body.deliveryStatus) {
    console.log("PASS: status update succeeded, deliveryStatus returned:", body.deliveryStatus);
  } else {
    console.error("FAIL: expected 200 with success + deliveryStatus.");
  }

  // Confirm the Firestore doc actually changed, not just the HTTP response.
  const updatedDoc = await db.collection("appointments").doc(testAppointmentId).get();
  if (updatedDoc.data().status === "confirmed") {
    console.log("PASS: Firestore appointment doc status is now \"confirmed\".");
  } else {
    console.error(`FAIL: Firestore doc status is "${updatedDoc.data().status}", expected "confirmed".`);
  }
}

async function cleanup() {
  if (testAppointmentId) {
    await db.collection("appointments").doc(testAppointmentId).delete();
    console.log(`\nTest appointment ${testAppointmentId} deleted (via Admin SDK).`);
  }
}

async function runTests() {
  try {
    const { vehicle } = await fetchCustomerAndVehicle();
    await createTestAppointment(vehicle.id);

    await testAvailabilityShowsBooked();
    await testAvailabilityOnSunday();
    await testPatchStatusInvalid();
    await testPatchStatusConfirmed();
  } catch (err) {
    console.error("\nTest run failed:", err.message);
  } finally {
    await cleanup();
    process.exit(0);
  }
}

runTests();