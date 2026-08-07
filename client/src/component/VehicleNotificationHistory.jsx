import { useEffect, useState } from "react";
import { getNotificationsByVehicle } from "../firebase/notifications";
import { formatDate } from "../utils/formatters";
import DeliveryStatusBadges from "./DeliveryStatusBadges";
import "./VehicleNotificationHistory.css";

// ---------------------------------------------------------------------------
// Per-vehicle notification history panel — fetches and displays the
// reminder log for a single vehicle. Used inside AdminCustomerProfilePage's
// expandable vehicle rows.
// ---------------------------------------------------------------------------
function VehicleNotificationHistory({ vehicleId }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getNotificationsByVehicle(vehicleId);
        setNotifications(data);
      } catch (err) {
        console.error("Failed to load notification history:", err);
        setError("Failed to load notification history.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [vehicleId]);

  if (loading) return <p className="history-status-text">Loading history...</p>;
  if (error) return <p className="error-text history-status-text">{error}</p>;
  if (notifications.length === 0) return <p className="history-status-text">No reminders sent yet.</p>;

  return (
    <table className="vehicle-history-table">
      <thead>
        <tr>
          <th>Sent</th>
          <th>Message</th>
          <th>Delivery</th>
        </tr>
      </thead>
      <tbody>
        {notifications.map((n) => (
          <tr key={n.id}>
            <td className="sent-cell">{formatDate(n.sentAt)}</td>
            <td>{n.message}</td>
            <td>
              <DeliveryStatusBadges deliveryStatus={n.deliveryStatus} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default VehicleNotificationHistory;