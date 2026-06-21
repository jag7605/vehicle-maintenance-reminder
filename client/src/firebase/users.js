import { collection, getDocs, query, where, doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

export async function getAllCustomers() {
  // Fetch all users with role "customer" — excludes the admin account
  const q = query(collection(db, "users"), where("role", "==", "customer"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

export async function getCustomerById(customerId) {
  // Fetch a single customer's document by their UID
  const docRef = doc(db, "users", customerId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error("Customer not found.");
  }

  return { id: docSnap.id, ...docSnap.data() };
}

export async function setCustomerActiveStatus(customerId, isActive) {
  // Toggle a customer's active status — used for deactivate/activate, not a hard delete
  const docRef = doc(db, "users", customerId);
  await updateDoc(docRef, { active: isActive });
}