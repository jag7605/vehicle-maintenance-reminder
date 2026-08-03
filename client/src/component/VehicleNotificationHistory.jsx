import { useEffect, useState } from "react";
import { getNotificationsByVehicle } from "../firebase/notifications";
import { formatDate } from "../utils/formatters";
import DeliveryStatusBadges from "./DeliveryStatusBadges";
 
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
 
  if (loading) return <p style={{ margin: "4px 0" }}>Loading history...</p>;
  if (error) return <p style={{ color: "red", margin: "4px 0" }}>{error}</p>;
  if (notifications.length === 0) return <p style={{ margin: "4px 0" }}>No reminders sent yet.</p>;
 
  return (
    <table border="1" cellPadding="4" style={{ marginTop: "6px", fontSize: "0.9em" }}>
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
            <td style={{ whiteSpace: "nowrap" }}>{formatDate(n.sentAt)}</td>
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