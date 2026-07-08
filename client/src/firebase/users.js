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

/**
 * Save (or overwrite) the current user's browser push subscription.
 * Called right after a successful PushManager.subscribe() in
 * NotificationPopup.jsx. sendPush() (pushService.js, backend) reads this
 * field back out as customer.pushSubscription when sending a reminder.
 */
export async function savePushSubscription(userId, subscription) {
  const docRef = doc(db, "users", userId);
  // subscription is a PushSubscription object — .toJSON() gives a plain
  // serializable object (endpoint + keys), which is what Firestore and
  // web-push both expect.
  await updateDoc(docRef, { pushSubscription: subscription.toJSON() });
}

/**
 * Remove the current user's saved push subscription — call this if the
 * user disables browser notifications, or if PushManager.subscribe() ever
 * needs to be re-run with a fresh subscription.
 */
export async function clearPushSubscription(userId) {
  const docRef = doc(db, "users", userId);
  await updateDoc(docRef, { pushSubscription: null });
}