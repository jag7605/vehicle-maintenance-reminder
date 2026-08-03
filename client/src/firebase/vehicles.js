import {
  addDoc,
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "./firebaseConfig";


export async function addVehicle(vehicleData) {
  // Step 1: Convert any Date fields to Firestore Timestamps before writing,
  // same convention used by updateVehicle(). nextWofDate/nextOilChangeDate
  // may be a JS Date (calculated at creation time) or null (not yet known).
  const firestoreData = { ...vehicleData };

  if (firestoreData.nextWofDate instanceof Date) {
    firestoreData.nextWofDate = Timestamp.fromDate(firestoreData.nextWofDate);
  }

  if (firestoreData.nextOilChangeDate instanceof Date) {
    firestoreData.nextOilChangeDate = Timestamp.fromDate(firestoreData.nextOilChangeDate);
  }

  // Step 2: Add a new document to the "vehicles" collection
  const docRef = await addDoc(collection(db, "vehicles"), firestoreData);

  // Step 3: Return the new document's auto-generated ID
  return docRef.id;
}

export async function getVehiclesByOwner(ownerId) {
  // Query vehicles where ownerId matches the logged-in customer's UID
  // Top-level collection keeps this query simple — no collection-group needed
  const q = query(collection(db, "vehicles"), where("ownerId", "==", ownerId));
  const snapshot = await getDocs(q);

  // Map each doc to its data plus its Firestore-generated ID
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getAllVehicles() {
  // Fetch every vehicle document, used for admin-side grouping by owner
  const snapshot = await getDocs(collection(db, "vehicles"));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function updateVehicle(vehicleId, updates) {
  // updates can include: year, mileage, rego, nextWofDate (JS Date or null),
  // nextOilChangeDate (JS Date or null), nextServiceMileage (number or null)
  // — make/model are not editable after creation
  const vehicleRef = doc(db, "vehicles", vehicleId);

  const firestoreUpdates = {
    ...(updates.year !== undefined && { year: updates.year }),
    ...(updates.mileage !== undefined && { mileage: updates.mileage }),
    ...(updates.rego !== undefined && { rego: updates.rego }),
  };

  // Convert nextWofDate JS Date → Firestore Timestamp if provided
  if (updates.nextWofDate instanceof Date) {
    firestoreUpdates.nextWofDate = Timestamp.fromDate(updates.nextWofDate);
  } else if (updates.nextWofDate === null) {
    firestoreUpdates.nextWofDate = null;
  }

  // Convert nextOilChangeDate JS Date → Firestore Timestamp if provided
  if (updates.nextOilChangeDate instanceof Date) {
    firestoreUpdates.nextOilChangeDate = Timestamp.fromDate(updates.nextOilChangeDate);
  } else if (updates.nextOilChangeDate === null) {
    firestoreUpdates.nextOilChangeDate = null;
  }

  // nextServiceMileage — store as number, or null to clear
  if (typeof updates.nextServiceMileage === "number") {
    firestoreUpdates.nextServiceMileage = updates.nextServiceMileage;
  } else if (updates.nextServiceMileage === null) {
    firestoreUpdates.nextServiceMileage = null;
  }

  // Pass firestoreUpdates (not the raw updates object)
  await updateDoc(vehicleRef, firestoreUpdates);
}

export async function deleteVehicle(vehicleId) {
  const vehicleRef = doc(db, "vehicles", vehicleId);
  await deleteDoc(vehicleRef);
}