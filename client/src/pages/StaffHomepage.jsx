import { Link } from "react-router-dom";
import StaffLayout from "../component/StaffLayout";
import NotificationPopup from "../component/NotificationPopup";
import { useDashboardSummary } from "../hooks/useDashboardSummary";
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

function StaffHomepage() {
  const {
    loading,
    error,
    activeCustomers,
    inactiveCustomerCount,
    totalVehicleCount,
    overdueCount,
    dueSoonCount,
    upcoming,
    ownerName,
  } = useDashboardSummary();

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
                {inactiveCustomerCount > 0
                  ? `${inactiveCustomerCount} inactive`
                  : "All accounts active"}
              </p>
            </div>

            <div className="card">
              <span className="summary-card-label">Vehicles</span>
              <div className="summary-card-value">{totalVehicleCount}</div>
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