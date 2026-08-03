// server/scripts/clearOldData.js
// Usage: node scripts/clearOldData.js --dry-run   (see what would be deleted)
//        node scripts/clearOldData.js              (actually delete)
const { db } = require("../firebase/adminConfig");

const COLLECTIONS_TO_CLEAR = ["appointments", "notifications", "vehicles"];
const isDryRun = process.argv.includes("--dry-run");

async function clearCollection(collectionName) {
  const snapshot = await db.collection(collectionName).get();

  console.log(`${collectionName}: ${snapshot.size} document(s) found.`);

  if (isDryRun) {
    snapshot.docs.forEach((doc) => console.log(`  [dry-run] would delete ${collectionName}/${doc.id}`));
    return;
  }

  const batchSize = 500; // Firestore batch write limit
  const docs = snapshot.docs;

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = db.batch();
    docs.slice(i, i + batchSize).forEach((doc) => batch.delete(doc.ref));
    await batch.commit();
    console.log(`  Deleted ${Math.min(i + batchSize, docs.length)}/${docs.length} from ${collectionName}`);
  }
}

async function run() {
  console.log(isDryRun ? "DRY RUN — nothing will actually be deleted.\n" : "LIVE RUN — documents will be permanently deleted.\n");

  for (const collectionName of COLLECTIONS_TO_CLEAR) {
    await clearCollection(collectionName);
  }

  console.log("\nDone.");
}

run().catch((err) => {
  console.error("Error clearing data:", err);
  process.exit(1);
});