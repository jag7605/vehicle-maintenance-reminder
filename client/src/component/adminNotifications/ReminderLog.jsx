import { formatDateTime } from "../../utils/formatters";
import DeliveryStatusBadges from "../DeliveryStatusBadges";
import "./ReminderLog.css";

function ReminderLog({ notifications, loading, error, unreadCount }) {
  if (loading) return <p>Loading reminder log...</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (notifications.length === 0) return <p>No reminders have been sent yet.</p>;

  return (
    <>
      {unreadCount > 0 && (
        <p className="unread-count-text">
          {unreadCount} notification{unreadCount > 1 ? "s" : ""} unread by customer
        </p>
      )}

      <div className="reminder-log-scroll">
        <table className="reminder-log-table">
          <thead>
            <tr>
              <th className="col-status">Status</th>
              <th className="col-sent">Sent</th>
              <th>Message</th>
              <th className="col-delivery">Delivery</th>
            </tr>
          </thead>
          <tbody>
            {notifications.map((n) => (
              <tr key={n.id} className={n.read ? "" : "reminder-row-unread"}>
                <td className="status-cell">
                  {n.read ? (
                    <span className="read-label">Read by customer</span>
                  ) : (
                    <strong className="unread-label">Unread by customer</strong>
                  )}
                </td>
                <td className="sent-cell">{formatDateTime(n.sentAt)}</td>
                <td className="message-cell">{n.message}</td>
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