import { useMemo, useState } from "react";
import StaffLayout from "../component/StaffLayout";
import { useReminderLog } from "../hooks/useReminderLog";
import ReminderLog from "../component/adminNotifications/ReminderLog";
import "./AdminNotificationPage.css";

// ---------------------------------------------------------------------------
// Admin Notifications page — customer reminder log.
// ---------------------------------------------------------------------------
function AdminNotificationPage() {
  const { notifications, loading, error } = useReminderLog();
  const [customerFilter, setCustomerFilter] = useState("");

  const customerOptions = useMemo(() => {
    const map = new Map();
    notifications.forEach((n) => {
      if (n.customerId) {
        map.set(n.customerId, n.customerName);
      }
    });
    return Array.from(map.entries()).sort((a, b) => a[1].localeCompare(b[1])); // [id, name]
  }, [notifications]);

  const filteredNotifications = customerFilter
    ? notifications.filter((n) => n.customerId === customerFilter)
    : notifications;

  const unreadCount = filteredNotifications.filter((n) => !n.read).length;

  return (
    <StaffLayout title="Notifications">
      <h2>Notifications</h2>

      <h3>Customer Reminder Log</h3>
      <p className="page-intro-text">
        All reminders sent to customers — manually triggered or automated by
        the daily schedule. Status shows whether the customer has read
        each one on their end in the customer portal.
      </p>

      {!loading && !error && (
        <div className="customer-filter-row">
          <label>
            Customer:{" "}
            <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)}>
              <option value="">All customers</option>
              {customerOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <ReminderLog
        notifications={filteredNotifications}
        loading={loading}
        error={error}
        unreadCount={unreadCount}
      />
    </StaffLayout>
  );
}

export default AdminNotificationPage;