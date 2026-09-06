// server/scripts/clearMockData.js
// Usage: node scripts/clearMockData.js --dry-run   (see what would be deleted)
//        node scripts/clearMockData.js              (actually delete)
//
// Deletes mock data across all four collections. Starts from users flagged
// isMockData: true, then also catches any vehicle owned by a mock customer
// (even if manually added through the app afterward, without the flag
// itself), and any notification/appointment tied to a mock customer or a
// mock-owned vehicle — so nothing gets orphaned if real data was later
// attached to a mock customer's account.
//
// Never touches real customers, the admin account, other team member
// accounts, or anything not connected to a mock customer. Separate from
// clearOldData.js, which wipes entire operational collections regardless
// of origin.

require("dotenv").config();
const { db } = require("../firebase/adminConfig");

const isDryRun = process.argv.includes("--dry-run");

// Firestore's "in" operator caps at 30 values per query — chunk any
// lookup list to stay under that regardless of how many mock customers exist.
const IN_QUERY_CHUNK_SIZE = 30;

function chunk(array, size) {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Runs a `where(field, "in", [...])` query across as many chunks as needed
// and merges the results, deduplicating by document ID.
async function queryByFieldIn(collectionName, field, values) {
  if (values.length === 0) return [];

  const resultsById = new Map();
  for (const idsChunk of chunk(values, IN_QUERY_CHUNK_SIZE)) {
    const snapshot = await db
      .collection(collectionName)
      .where(field, "in", idsChunk)
      .get();
    snapshot.docs.forEach((doc) => resultsById.set(doc.id, doc));
  }
  return Array.from(resultsById.values());
}

async function deleteDocs(collectionName, docs) {
  if (isDryRun) {
    docs.forEach((doc) => console.log(`  [dry-run] would delete ${collectionName}/${doc.id}`));
    return docs.length;
  }

  const batchSize = 500;
  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    docs.slice(i, i + batchSize).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    console.log(`  Deleted ${Math.min(i + batchSize, docs.length)}/${docs.length} from ${collectionName}`);
  }
  return docs.length;
}

async function run() {
  console.log(isDryRun ? "DRY RUN — nothing will actually be deleted.\n" : "LIVE RUN — mock-related documents will be permanently deleted.\n");

  // ---- Step 1: find mock customers ----
  const mockUsersSnapshot = await db.collection("users").where("isMockData", "==", true).get();
  const mockUserDocs = mockUsersSnapshot.docs;
  const mockUserIds = mockUserDocs.map((doc) => doc.id);
  console.log(`users: ${mockUserDocs.length} mock document(s) found.`);

  // ---- Step 2: find every vehicle owned by a mock customer, flagged or not ----
  const flaggedVehiclesSnapshot = await db.collection("vehicles").where("isMockData", "==", true).get();
  const ownedByMockVehicles = await queryByFieldIn("vehicles", "ownerId", mockUserIds);

  const vehicleDocsById = new Map();
  flaggedVehiclesSnapshot.docs.forEach((doc) => vehicleDocsById.set(doc.id, doc));
  ownedByMockVehicles.forEach((doc) => vehicleDocsById.set(doc.id, doc));
  const vehicleDocs = Array.from(vehicleDocsById.values());
  const vehicleIds = vehicleDocs.map((doc) => doc.id);

  const orphanRiskCount = vehicleDocs.length - flaggedVehiclesSnapshot.size;
  console.log(`vehicles: ${vehicleDocs.length} document(s) found (${flaggedVehiclesSnapshot.size} flagged + ${orphanRiskCount} unflagged but owned by a mock customer).`);

  // ---- Step 3: find every notification tied to a mock customer or mock-owned vehicle, flagged or not ----
  const flaggedNotificationsSnapshot = await db.collection("notifications").where("isMockData", "==", true).get();
  const notifByCustomer = await queryByFieldIn("notifications", "customerId", mockUserIds);
  const notifByVehicle = await queryByFieldIn("notifications", "vehicleId", vehicleIds);

  const notificationDocsById = new Map();
  [...flaggedNotificationsSnapshot.docs, ...notifByCustomer, ...notifByVehicle].forEach((doc) =>
    notificationDocsById.set(doc.id, doc)
  );
  const notificationDocs = Array.from(notificationDocsById.values());
  console.log(`notifications: ${notificationDocs.length} document(s) found.`);

  // ---- Step 4: same for appointments ----
  const flaggedAppointmentsSnapshot = await db.collection("appointments").where("isMockData", "==", true).get();
  const apptByCustomer = await queryByFieldIn("appointments", "customerId", mockUserIds);
  const apptByVehicle = await queryByFieldIn("appointments", "vehicleId", vehicleIds);

  const appointmentDocsById = new Map();
  [...flaggedAppointmentsSnapshot.docs, ...apptByCustomer, ...apptByVehicle].forEach((doc) =>
    appointmentDocsById.set(doc.id, doc)
  );
  const appointmentDocs = Array.from(appointmentDocsById.values());
  console.log(`appointments: ${appointmentDocs.length} document(s) found.`);

  // ---- Delete in dependency order: appointments/notifications first, then vehicles, then users ----
  console.log("");
  const counts = {
    appointments: await deleteDocs("appointments", appointmentDocs),
    notifications: await deleteDocs("notifications", notificationDocs),
    vehicles: await deleteDocs("vehicles", vehicleDocs),
    users: await deleteDocs("users", mockUserDocs),
  };

  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  console.log("\n--- Summary ---");
  for (const [collectionName, count] of Object.entries(counts)) {
    console.log(`${collectionName.padEnd(15)} ${count}`);
  }
  console.log("-".repeat(23));
  console.log(`${"Total".padEnd(15)} ${total}`);

  console.log(
    isDryRun
      ? "\n[dry-run] No documents were deleted."
      : "\nDone. Only mock customers and anything connected to them were affected."
  );
}

run().catch((err) => {
  console.error("Error clearing mock data:", err);
  process.exit(1);
});