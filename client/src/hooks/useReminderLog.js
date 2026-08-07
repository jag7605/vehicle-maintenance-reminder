import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { getAllCustomers } from "../firebase/users";

export function useReminderLog() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [snapshot, customerData] = await Promise.all([
          getDocs(query(collection(db, "notifications"), orderBy("sentAt", "desc"))),
          getAllCustomers(),
        ]);

        const customerMap = new Map(customerData.map((c) => [c.id, c]));

        const data = snapshot.docs.map((d) => {
          const notification = { id: d.id, ...d.data() };
          const customer = customerMap.get(notification.customerId);

          return {
            ...notification,
            customerName: customer
              ? `${customer.firstName} ${customer.lastName}`
              : "Unknown customer",
          };
        });

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

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, loading, error, unreadCount };
}