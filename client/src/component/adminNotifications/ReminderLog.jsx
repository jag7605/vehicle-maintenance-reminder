import { formatDateTime } from "../../utils/formatters";
import DeliveryStatusBadges from "../DeliveryStatusBadges";

function ReminderLog({ notifications, loading, error, unreadCount }) {
  if (loading) return <p>Loading reminder log...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;
  if (notifications.length === 0) return <p>No reminders have been sent yet.</p>;
 
  return (
    <>
      {unreadCount > 0 && (
        <p style={{ color: "#555" }}>
          {unreadCount} notification{unreadCount > 1 ? "s" : ""} unread by customer
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
              <th style={{ width: "150px" }}>Status</th>
              <th style={{ width: "140px", whiteSpace: "nowrap" }}>Sent</th>
              <th>Message</th>
              <th style={{ width: "160px" }}>Delivery</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((n) => (
              <tr key={n.id} style={{ backgroundColor: n.read ? "transparent" : "#f0f7ff" }}>
                <td style={{ textAlign: "center" }}>
                  {n.read ? (
                    <span style={{ color: "#999" }}>Read by customer</span>
                  ) : (
                    <strong style={{ color: "#0055cc" }}>Unread by customer</strong>
                  )}
                </td>
                <td style={{ whiteSpace: "nowrap" }}>{formatDateTime(n.sentAt)}</td>
                <td style={{ wordBreak: "break-word", maxWidth: "340px" }}>{n.message}</td>
                <td>
                  <DeliveryStatusBadges deliveryStatus={n.deliveryStatus} />
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