import { useEffect, useState, useCallback } from "react";
import { collection, query, orderBy, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";
import { getAllCustomers } from "../firebase/users";


const CACHE_TTL_MS = 30_000;
let cache = null; // { notifications, fetchedAt }

export function invalidateReminderLogCache() {
  cache = null;
}

function isCacheFresh() {
  return cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
}

export function useReminderLog() {
  const [notifications, setNotifications] = useState(() => (isCacheFresh() ? cache.notifications : []));
  const [loading, setLoading] = useState(!isCacheFresh());
  const [error, setError] = useState("");

  const load = useCallback(async ({ force = false } = {}) => {
    if (!force && isCacheFresh()) {
      setNotifications(cache.notifications);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

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

      cache = { notifications: data, fetchedAt: Date.now() };
      setNotifications(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load reminder log. A Firestore index on sentAt (desc) may be required.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => load({ force: true }), [load]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, loading, error, unreadCount, refresh };
}