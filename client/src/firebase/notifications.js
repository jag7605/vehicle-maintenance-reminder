import { collection, query, where, getDocs, doc, updateDoc, orderBy, } from "firebase/firestore";
import { db } from "./firebaseConfig";

/**
 * Fetch all notifications for a specific vehicle.
 * Used by admins to display delivery history per vehicle.
 */
export async function getNotificationsByVehicle(vehicleId) {
  const q = query(
    collection(db, "notifications"),
    where("vehicleId", "==", vehicleId),
    orderBy("sentAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Fetch all notifications for a specific customer.
 * Used by customers to display their own notification inbox.
 */
export async function getNotificationsByCustomer(customerId) {
  const q = query(
    collection(db, "notifications"),
    where("customerId", "==", customerId),
    orderBy("sentAt", "desc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Mark a notification as read.
 * Firestore security rules allow customers to update the read field only.
 */
export async function markNotificationRead(notificationId) {
  const notifRef = doc(db, "notifications", notificationId);
  await updateDoc(notifRef, { read: true });
}