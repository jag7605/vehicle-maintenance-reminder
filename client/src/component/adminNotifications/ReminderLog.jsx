import { formatDateTime } from "../../utils/formatters";
import DeliveryStatusBadges from "../DeliveryStatusBadges";

function ReminderLog({ notifications, loading, error, unreadCount, onMarkRead }) {
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
              <tr key={n.id} style={{ backgroundColor: n.read ? "transparent" : "#f0f7ff" }}>
                <td style={{ textAlign: "center" }}>
                  {n.read ? (
                    <span style={{ color: "#999" }}>Read</span>
                  ) : (
                    <strong style={{ color: "#0055cc" }}>Unread</strong>
                  )}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(n.sentAt)}</td>
                <td style={{ wordBreak: "break-word", maxWidth: "340px" }}>{n.message}</td>
                <td>
                  <DeliveryStatusBadges deliveryStatus={n.deliveryStatus} />
                </td>
                <td style={{ textAlign: "center" }}>
                  {!n.read && (
                    <button onClick={() => onMarkRead(n.id)}>Mark as Read</button>
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
 
export default ReminderLog;