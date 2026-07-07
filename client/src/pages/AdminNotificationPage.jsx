import StaffLayout from "../component/StaffLayout";
import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "../firebase/firebaseConfig";

// ---------------------------------------------------------------------------
// Helper — format a Firestore Timestamp for display
// ---------------------------------------------------------------------------
function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return date.toLocaleString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ---------------------------------------------------------------------------
// Helper — render per-channel delivery status badges
// ---------------------------------------------------------------------------
function DeliveryStatusBadges({ deliveryStatus }) {
  if (!deliveryStatus || Object.keys(deliveryStatus).length === 0) {
    return <span style={{ color: "#999" }}>No delivery data</span>;
  }
 
  const channelLabels = { email: "Email", browser: "Browser", sms: "SMS" };
  const allChannels = ["email", "browser", "sms"];
 
  return (
    <span>
      {allChannels.map((channel) => {
        if (!(channel in deliveryStatus)) {
          return (
            <span key={channel} style={{ marginRight: "8px", color: "#999" }}>
              {channelLabels[channel]}: disabled
            </span>
          );
        }
        const status = deliveryStatus[channel];
        return (
          <span
            key={channel}
            style={{
              marginRight: "8px",
              color: status === "sent" ? "green" : "red",
            }}
          >
            {channelLabels[channel]}: {status}
          </span>
        );
      })}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Section: Customer Reminder Log
// Reads from the notifications collection — written by the backend whenever
// a reminder is sent (manually or by the scheduled cron job)
// ---------------------------------------------------------------------------
function ReminderLog() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 
  useEffect(() => {
    async function load() {
      try {
        const q = query(
          collection(db, "notifications"),
          orderBy("sentAt", "desc")
        );
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
 
  async function handleMarkRead(notifId) {
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
 
  if (loading) return <p>Loading reminder log...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (notifications.length === 0) return <p>No reminders have been sent yet.</p>;
 
  return (
    <>
      {unreadCount > 0 && (
        <p style={{ color: "#555" }}>
          {unreadCount} unread reminder{unreadCount > 1 ? "s" : ""}
        </p>
      )}
      
      {/* Scrollable wrapper prevents layout breaking on smaller screens */}
      <div style={{ overflowX: "auto", width: "100%" }}>
        <table
          border="1"
          cellPadding="8"
          style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}
        >
          <thead>
            <tr>
              <th style={{ width: "80px" }}>Status</th>
              <th style={{ width: "140px", whiteSpace: "nowrap" }}>Sent</th>
              <th>Message</th>
              <th style={{ width: "160px" }}>Delivery</th>
              <th style={{ width: "110px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((n) => (
              <tr
                key={n.id}
                style={{ backgroundColor: n.read ? "transparent" : "#f0f7ff" }}
              >
                <td style={{ textAlign: "center" }}>
                  {n.read ? (
                    <span style={{ color: "#999" }}>Read</span>
                  ) : (
                    <strong style={{ color: "#0055cc" }}>Unread</strong>
                  )}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>{formatDate(n.sentAt)}</td>
                <td style={{ wordBreak: "break-word", maxWidth: "340px" }}>
                  {n.message}
                </td>
                <td>
                  <DeliveryStatusBadges deliveryStatus={n.deliveryStatus} />
                </td>
                <td style={{ textAlign: "center" }}>
                  {!n.read && (
                    <button onClick={() => handleMarkRead(n.id)}>
                      Mark as Read
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Section: Internal Staff Notifications (placeholder)
// To be implemented when Jobs, Bookings, and Task Tracker pages are built.
// These will be sourced from a separate adminNotifications collection,
// written to whenever a job is started/completed or a booking is confirmed.
// ---------------------------------------------------------------------------
function StaffNotificationLog() {
  return (
    <div
      style={{
        border: "1px dashed #aaa",
        padding: "16px",
        borderRadius: "4px",
        color: "#777",
        backgroundColor: "#fafafa",
      }}
    >
      <p style={{ margin: 0 }}>
        <strong>Coming in a future sprint</strong>
      </p>
      <p style={{ margin: "8px 0 0" }}>
        Internal staff alerts for job started, job completed, and booking
        confirmed events will appear here once Jobs, Bookings, and Task Tracker
        pages are built. These will be sourced from a separate{" "}
        <code>adminNotifications</code> Firestore collection.
      </p>
    </div>
  );
}
 
// ---------------------------------------------------------------------------
// Main page — tabbed view between reminder log and staff notifications
// ---------------------------------------------------------------------------
function AdminNotificationPage() {
  const [activeTab, setActiveTab] = useState("reminders"); // "reminders" | "staff"
 
  return (
    <StaffLayout title="Notifications">
      <h2>Notifications</h2>
 
      {/* Tab switcher */}
      <div style={{ marginBottom: "16px" }}>
        <button
          onClick={() => setActiveTab("reminders")}
          disabled={activeTab === "reminders"}
          style={{ marginRight: "8px" }}
        >
          Customer Reminders
        </button>
        <button
          onClick={() => setActiveTab("staff")}
          disabled={activeTab === "staff"}
        >
          Staff Alerts
        </button>
      </div>
 
      {/* Tab content */}
      {activeTab === "reminders" && (
        <>
          <h3>Customer Reminder Log</h3>
          <p style={{ color: "#555", marginBottom: "12px" }}>
            All reminders sent to customers — manually triggered or automated by
            the daily schedule. Click "Mark as Read" to track which ones you've
            already followed up on.
          </p>
          <ReminderLog />
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