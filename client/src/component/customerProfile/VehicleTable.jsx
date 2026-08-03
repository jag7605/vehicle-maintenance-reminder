import { Fragment } from "react";
import { formatDate, isPastDate } from "../../utils/formatters";
import DeliveryStatusBadges from "../DeliveryStatusBadges";
import VehicleNotificationHistory from "../VehicleNotificationHistory";

// ---------------------------------------------------------------------------
// Renders the customer's vehicle list, plus each row's inline reminder
// result and expandable notification history. Pure presentational.
//
// "Send Reminder" now opens the notify popup (onOpenNotify) rather than
// firing the API call directly — the popup is what actually sends it.
// ---------------------------------------------------------------------------
function VehicleTable({
  vehicles,
  reminderLoading,
  reminderResult,
  expandedHistory,
  onEdit,
  onDelete,
  onOpenNotify,
  onToggleHistory,
}) {
  if (vehicles.length === 0) {
    return <p>No vehicles on file.</p>;
  }

  return (
    <table border="1" cellPadding="6">
      <thead>
        <tr>
          <th>Year</th>
          <th>Make</th>
          <th>Model</th>
          <th>Rego</th>
          <th>Mileage</th>
          <th>Next WoF Date</th>
          <th>Next Oil Change Date</th>
          <th>Next Service Mileage</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((vehicle) => {
          const result = reminderResult[vehicle.id];
          const isLoadingReminder = reminderLoading[vehicle.id];
          const historyOpen = expandedHistory[vehicle.id];

          return (
            <Fragment key={vehicle.id}>
              <tr>
                <td>{vehicle.year}</td>
                <td>{vehicle.make}</td>
                <td>{vehicle.model}</td>
                <td>{vehicle.rego}</td>
                <td>{vehicle.mileage}</td>
                <td style={isPastDate(vehicle.nextWofDate) ? { color: "red" } : undefined}>
                  {formatDate(vehicle.nextWofDate)}
                  {isPastDate(vehicle.nextWofDate) && " (Overdue)"}
                </td>
                <td style={isPastDate(vehicle.nextOilChangeDate) ? { color: "red" } : undefined}>
                  {formatDate(vehicle.nextOilChangeDate)}
                  {isPastDate(vehicle.nextOilChangeDate) && " (Overdue)"}
                </td>
                <td>
                  {vehicle.nextServiceMileage != null
                    ? `${vehicle.nextServiceMileage.toLocaleString()} km`
                    : "—"}
                </td>
                <td>
                  <button onClick={() => onEdit(vehicle)}>Edit</button>{" "}
                  <button onClick={() => onDelete(vehicle)}>Delete</button>{" "}
                  <button onClick={() => onOpenNotify(vehicle)} disabled={isLoadingReminder}>
                    {isLoadingReminder ? "Sending..." : "Send Notification"}
                  </button>{" "}
                  <button onClick={() => onToggleHistory(vehicle.id)}>
                    {historyOpen ? "Hide History" : "Show History"}
                  </button>
                </td>
              </tr>

              {result && (
                <tr>
                  <td colSpan="9">
                    {result.success ? (
                      <span>
                        <strong>Notification sent.</strong>{" "}
                        <DeliveryStatusBadges deliveryStatus={result.deliveryStatus} />
                      </span>
                    ) : (
                      <span style={{ color: "red" }}>
                        <strong>Failed:</strong> {result.error}
                      </span>
                    )}
                  </td>
                </tr>
              )}

              {historyOpen && (
                <tr>
                  <td colSpan="9">
                    <strong>Notification History</strong>
                    <VehicleNotificationHistory vehicleId={vehicle.id} />
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </table>
  );
}

export default VehicleTable;