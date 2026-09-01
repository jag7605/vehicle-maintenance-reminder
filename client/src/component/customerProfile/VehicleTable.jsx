import { Fragment } from "react";
import { formatDate, isPastDate } from "../../utils/formatters";
import DeliveryStatusBadges from "../DeliveryStatusBadges";
import VehicleNotificationHistory from "../VehicleNotificationHistory";
import "./VehicleTable.css";

const DUE_SOON_WINDOW_DAYS = 30;

// ---------------------------------------------------------------------------
// Helper — returns { status, daysOut } for a given date value.
// status is "overdue" | "upcoming" | "none". "upcoming" only applies within
// the next DUE_SOON_WINDOW_DAYS days, so dates far in the future stay
// unstyled rather than being flagged orange. daysOut is the absolute number
// of days overdue/until due, or null if there's no date.
// ---------------------------------------------------------------------------
function getDateStatus(value) {
  if (!value) return { status: "none", daysOut: null };

  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysOut = Math.round((startOfDay(date) - startOfDay(new Date())) / msPerDay);

  if (isPastDate(value)) return { status: "overdue", daysOut: Math.abs(daysOut) };

  return {
    status: daysOut <= DUE_SOON_WINDOW_DAYS ? "upcoming" : "none",
    daysOut,
  };
}

function dateClassName(status) {
  if (status === "overdue") return "date-flag";
  if (status === "upcoming") return "date-flag-upcoming";
  return undefined;
}

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
    <table>
      <thead>
        <tr>
          <th>Year</th>
          <th>Make</th>
          <th>Model</th>
          <th>Rego</th>
          <th>Mileage (KMS)</th>
          <th>Next WoF Date</th>
          <th>Next Oil Change Date</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {vehicles.map((vehicle) => {
          const result = reminderResult[vehicle.id];
          const isLoadingReminder = reminderLoading[vehicle.id];
          const historyOpen = expandedHistory[vehicle.id];

          const wofInfo = getDateStatus(vehicle.nextWofDate);
          const oilInfo = getDateStatus(vehicle.nextOilChangeDate);

          return (
            <Fragment key={vehicle.id}>
              <tr>
                <td>{vehicle.year}</td>
                <td>{vehicle.make}</td>
                <td>{vehicle.model}</td>
                <td>{vehicle.rego}</td>
                <td>{vehicle.mileage}</td>
                <td className={dateClassName(wofInfo.status)}>
                  {formatDate(vehicle.nextWofDate)}
                  {wofInfo.status === "overdue" && ` (${wofInfo.daysOut} days Overdue)`}
                  {wofInfo.status === "upcoming" && ` (Due in ${wofInfo.daysOut} days)`}
                </td>
                <td className={dateClassName(oilInfo.status)}>
                  {formatDate(vehicle.nextOilChangeDate)}
                  {oilInfo.status === "overdue" && ` (${oilInfo.daysOut} days overdue)`}
                  {oilInfo.status === "upcoming" && ` (Due in ${oilInfo.daysOut} days)`}
                </td>
                <td style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => onEdit(vehicle)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => onDelete(vehicle)}>Delete</button>
                  <button
                    className={`btn btn-sm ${isLoadingReminder ? "btn-disabled" : "btn-primary"}`}
                    onClick={() => onOpenNotify(vehicle)}
                    disabled={isLoadingReminder}
                  >
                    {isLoadingReminder ? "Sending..." : "Send Notification"}
                  </button>
                  <button className="btn btn-secondary btn-sm" onClick={() => onToggleHistory(vehicle.id)}>
                    {historyOpen ? "Hide History" : "Show History"}
                  </button>
                </td>
              </tr>

              {result && (
                <tr>
                  <td colSpan="8">
                    {result.success ? (
                      <span>
                        <strong>Notification sent.</strong>{" "}
                        <DeliveryStatusBadges deliveryStatus={result.deliveryStatus} />
                      </span>
                    ) : (
                      <span className="error-text">
                        <strong>Failed:</strong> {result.error}
                      </span>
                    )}
                  </td>
                </tr>
              )}

              {historyOpen && (
                <tr>
                  <td colSpan="8">
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