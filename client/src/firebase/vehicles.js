import { addDoc, collection } from "firebase/firestore";
import { db } from "./firebaseConfig";

export async function addVehicle(vehicleData) {
  // Step 1: Add a new document to the "vehicles" collection
  // vehicleData should include: make, model, year, mileage, rego, ownerId
  const docRef = await addDoc(collection(db, "vehicles"), vehicleData);

  // Step 2: Return the new document's auto-generated ID
  return docRef.id;
}