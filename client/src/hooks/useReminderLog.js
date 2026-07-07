import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

export function useReminderLog() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 
  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, "notifications"), orderBy("sentAt", "desc"));
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setNotifications(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load reminder log. A Firestore index on sentAt (desc) may be required.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);
 
  async function markRead(notifId) {
    try {
      await updateDoc(doc(db, "notifications", notifId), { read: true });
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
      );
    } catch {
      // Silent fail — non-critical action
    }
  }
 
  const unreadCount = notifications.filter((n) => !n.read).length;
 
  return { notifications, loading, error, unreadCount, markRead };
}