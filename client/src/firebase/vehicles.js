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
  // Step 1: Add a new document to the "vehicles" collection
  // vehicleData should include: make, model, year, mileage, rego, ownerId
  const docRef = await addDoc(collection(db, "vehicles"), vehicleData);

  // Step 2: Return the new document's auto-generated ID
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
  // updates can include: year, mileage, rego, nextServiceDate (JS Date or null),
  // nextServiceMileage (number or null) — make/model are not editable after creation
  const vehicleRef = doc(db, "vehicles", vehicleId);

  const firestoreUpdates = {
    ...(updates.year !== undefined && { year: updates.year }),
    ...(updates.mileage !== undefined && { mileage: updates.mileage }),
    ...(updates.rego !== undefined && { rego: updates.rego }),
  };

  // Convert nextServiceDate JS Date → Firestore Timestamp if provided
  if (updates.nextServiceDate instanceof Date) {
    firestoreUpdates.nextServiceDate = Timestamp.fromDate(updates.nextServiceDate);
  } else if (updates.nextServiceDate === null) {
    firestoreUpdates.nextServiceDate = null;
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