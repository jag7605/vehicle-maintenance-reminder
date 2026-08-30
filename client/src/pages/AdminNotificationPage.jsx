import { useMemo, useState } from "react";
import StaffLayout from "../component/StaffLayout";
import { useReminderLog } from "../hooks/useReminderLog";
import { usePagination } from "../hooks/usePagination";
import ReminderLog from "../component/adminNotifications/ReminderLog";
import Pagination from "../component/Pagination";
import "./AdminNotificationPage.css";
import "../component/FormControls.css";

const PAGE_SIZE = 10;

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

  // Unread count reflects the full filtered set, not just the current page —
  // otherwise switching pages would make the count look like it's changing
  // when nothing about read/unread status actually did.
  const unreadCount = filteredNotifications.filter((n) => !n.read).length;

  const { pageItems, currentPage, totalPages, setPage } = usePagination(
    filteredNotifications,
    PAGE_SIZE
  );

  return (
    <StaffLayout title="Notifications">
      <div className="page-header">
        <h1>Notifications</h1>
      </div>

      <h2>Customer Reminder Log</h2>
      <p className="page-intro-text">
        All reminders sent to customers — manually triggered or automated by
        the daily schedule. Status shows whether the customer has read
        each one on their end in the customer portal.
      </p>

      {!loading && !error && (
        <div className="customer-filter-row">
          <label>
            Customer:{" "}
            <select value={customerFilter} onChange={(e) => setCustomerFilter(e.target.value)} className="select-control">
              <option value="">All customers</option>
              {customerOptions.map(([id, name]) => (
                <option key={id} value={id}>{name}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      <ReminderLog
        notifications={pageItems}
        loading={loading}
        error={error}
        unreadCount={unreadCount}
      />

      {!loading && !error && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}
    </StaffLayout>
  );
}

export default AdminNotificationPage;