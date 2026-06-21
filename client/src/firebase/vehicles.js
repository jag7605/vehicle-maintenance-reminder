import { addDoc, collection, getDocs, query, where, doc, updateDoc, deleteDoc } from "firebase/firestore";
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
  // updates should only include: year, mileage, rego — make/model are not editable
  const vehicleRef = doc(db, "vehicles", vehicleId);
  await updateDoc(vehicleRef, updates);
}

export async function deleteVehicle(vehicleId) {
  const vehicleRef = doc(db, "vehicles", vehicleId);
  await deleteDoc(vehicleRef);
}