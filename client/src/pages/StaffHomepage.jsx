import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StaffLayout from "../component/StaffLayout";
import NotificationPopup from "../component/NotificationPopup";
import { getAllCustomers } from "../firebase/users";
import { getAllVehicles } from "../firebase/vehicles";
import "./StaffHomepage.css";

const DUE_SOON_WINDOW_DAYS = 30;

// ---------------------------------------------------------------------------
// Helper — format a Firestore Timestamp or JS Date for display
// ---------------------------------------------------------------------------
function formatDate(value) {
  if (!value) return "—";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Helper — days between today and a Firestore Timestamp/Date (negative = past)
// ---------------------------------------------------------------------------
function daysUntil(value) {
  if (!value) return null;
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  const msPerDay = 1000 * 60 * 60 * 24;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.round((date - today) / msPerDay);
}

function StaffHomepage() {
  const [customers, setCustomers] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [customerList, vehicleList] = await Promise.all([
          getAllCustomers(),
          getAllVehicles(),
        ]);
        setCustomers(customerList);
        setVehicles(vehicleList);
      } catch {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeCustomers = customers.filter((c) => c.active !== false).length;

  const vehiclesWithService = vehicles
    .map((v) => ({ ...v, daysOut: daysUntil(v.nextServiceDate) }))
    .filter((v) => v.daysOut !== null);

  const overdueCount = vehiclesWithService.filter((v) => v.daysOut < 0).length;
  const dueSoonCount = vehiclesWithService.filter(
    (v) => v.daysOut >= 0 && v.daysOut <= DUE_SOON_WINDOW_DAYS
  ).length;

  // Overdue first (most overdue first), then soonest-due — top 8 for the table
  const upcoming = vehiclesWithService
    .filter((v) => v.daysOut <= DUE_SOON_WINDOW_DAYS)
    .sort((a, b) => a.daysOut - b.daysOut)
    .slice(0, 8);

  function ownerName(ownerId) {
    const owner = customers.find((c) => c.id === ownerId);
    return owner ? `${owner.firstName} ${owner.lastName}` : "—";
  }

  return (
    <StaffLayout title="Dashboard">
      <NotificationPopup />

      <div className="page-header">
        <h1>Overview</h1>
      </div>

      {loading && <p>Loading dashboard...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && (
        <>
          <div className="summary-cards">
            <div className="card">
              <span className="summary-card-label">Customers</span>
              <div className="summary-card-value">{activeCustomers}</div>
              <p className="summary-card-sub">
                {customers.length - activeCustomers > 0
                  ? `${customers.length - activeCustomers} inactive`
                  : "All accounts active"}
              </p>
            </div>

            <div className="card">
              <span className="summary-card-label">Vehicles</span>
              <div className="summary-card-value">{vehicles.length}</div>
              <p className="summary-card-sub">On file across all customers</p>
            </div>

            <div className="card">
              <span className="summary-card-label">Overdue Services</span>
              <div className={`summary-card-value${overdueCount > 0 ? " is-alert" : ""}`}>
                {overdueCount}
              </div>
              <p className="summary-card-sub">Past their next service date</p>
            </div>

            <div className="card">
              <span className="summary-card-label">Due Within 30 Days</span>
              <div className="summary-card-value">{dueSoonCount}</div>
              <p className="summary-card-sub">Upcoming service reminders</p>
            </div>
          </div>

          <div className="upcoming-section">
            <h2>Upcoming Services</h2>
            <p className="page-subtitle">
              Vehicles overdue or due for service within the next {DUE_SOON_WINDOW_DAYS} days.
            </p>

            {upcoming.length === 0 ? (
              <div className="card">You're all caught up — nothing due soon.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Vehicle</th>
                    <th>Rego</th>
                    <th>Service Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map((v) => (
                    <tr key={v.id}>
                      <td>
                        <Link to={`/admin/customers/${v.ownerId}`}>
                          {ownerName(v.ownerId)}
                        </Link>
                      </td>
                      <td>{v.year} {v.make} {v.model}</td>
                      <td>{v.rego}</td>
                      <td className={v.daysOut < 0 ? "date-flag" : undefined}>
                        {formatDate(v.nextServiceDate)}
                      </td>
                      <td>
                        {v.daysOut < 0 ? (
                          <span className="badge overdue-badge">
                            {Math.abs(v.daysOut)}d overdue
                          </span>
                        ) : (
                          <span className="badge badge-pending">
                            {v.daysOut === 0 ? "Due today" : `Due in ${v.daysOut}d`}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </StaffLayout>
  );
}

export default StaffHomepage;