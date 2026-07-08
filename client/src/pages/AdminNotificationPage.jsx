import { useState } from "react";
import StaffLayout from "../component/StaffLayout";
import { useReminderLog } from "../hooks/useReminderLog";
import ReminderLog from "../component/adminNotifications/ReminderLog";
import StaffNotificationLog from "../component/adminNotifications/StaffNotificationLog";
 
// ---------------------------------------------------------------------------
// Admin Notifications page — tabbed view between the customer reminder log
// and (future) internal staff alerts. Data loading lives in useReminderLog();
// this component only handles the tab switch and composition.
// ---------------------------------------------------------------------------
function AdminNotificationPage() {
  const [activeTab, setActiveTab] = useState("reminders"); // "reminders" | "staff"
  const { notifications, loading, error, unreadCount } = useReminderLog();
 
  return (
    <StaffLayout title="Notifications">
      <h2>Notifications</h2>
 
      <div style={{ marginBottom: "16px" }}>
        <button
          onClick={() => setActiveTab("reminders")}
          disabled={activeTab === "reminders"}
          style={{ marginRight: "8px" }}
        >
          Customer Reminders
        </button>
        <button onClick={() => setActiveTab("staff")} disabled={activeTab === "staff"}>
          Staff Alerts
        </button>
      </div>
 
      {activeTab === "reminders" && (
        <>
          <h3>Customer Reminder Log</h3>
          <p style={{ color: "#555", marginBottom: "12px" }}>
            All reminders sent to customers — manually triggered or automated by
            the daily schedule. Status shows whether the customer has read
            each one on their end.
          </p>
          <ReminderLog
            notifications={notifications}
            loading={loading}
            error={error}
            unreadCount={unreadCount}
          />
        </>
      )}
 
      {activeTab === "staff" && (
        <>
          <h3>Staff Alerts</h3>
          <p style={{ color: "#555", marginBottom: "12px" }}>
            Internal notifications for job, booking, and task events.
          </p>
          <StaffNotificationLog />
        </>
      )}
    </StaffLayout>
  );
}
 
export default AdminNotificationPage;