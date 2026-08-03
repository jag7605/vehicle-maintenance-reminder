require("dotenv").config();
// TEMPORARY TEST SCRIPT — delete after confirming email and SMS work
// Run from inside the server/ folder with: node testReminder.js

const { db } = require("../firebase/adminConfig");
const { sendReminder } = require("../services/notificationService");

const CUSTOMER_ID = "5cnbF1Wvv7ZPexVCxUGyIchGPQA2";

const mockVehicle = {
  id: "test-vehicle-id",
  make: "Toyota",
  model: "Camry",
  year: 2020,
  rego: "TEST123",
  ownerId: CUSTOMER_ID,
  nextServiceDate: {
    toDate: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  },
};

async function runTest() {
  try {
    // Fetch your real customer document from Firestore
    const customerSnap = await db.collection("users").doc(CUSTOMER_ID).get();

    if (!customerSnap.exists) {
      console.error("Customer document not found. Check the UID.");
      process.exit(1);
    }

    const customer = { id: customerSnap.id, ...customerSnap.data() };
    console.log("Customer fetched:", customer.firstName, customer.lastName);
    console.log("Sending reminder...");

    const deliveryStatus = await sendReminder(mockVehicle, customer);
    console.log("Done. Delivery status:", deliveryStatus);
  } catch (err) {
    console.error("Test failed:", err.message);
  } finally {
    process.exit(0);
  }
}

runTest();