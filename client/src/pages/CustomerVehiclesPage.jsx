import { useEffect, useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { getVehiclesByOwner } from "../firebase/vehicles";
import { formatDate, isPastDate } from "../utils/formatters";
import "./CustomerVehiclesPage.css";

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

function CustomerVehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    async function fetchVehicles() {
      // auth.currentUser is guaranteed non-null here — ProtectedRoute has
      // already confirmed an authenticated session before rendering this page
      const uid = auth.currentUser.uid;

      try {
        const data = await getVehiclesByOwner(uid);
        setVehicles(data);
        setStatus("done");
      } catch (err) {
        console.error("Failed to fetch vehicles:", err);
        setStatus("error");
      }
    }

    fetchVehicles();
  }, []);

  if (status === "loading") {
    return <p>Loading vehicles...</p>;
  }

  if (status === "error") {
    return <p>Something went wrong. Please try again.</p>;
  }

  return (
    <div className="customer-vehicles-page">

      <h1 className="customer-vehicles-title">
        My Vehicles
      </h1>

      {vehicles.length === 0 ? (
        <div className="customer-vehicles-empty">
          No vehicles found.
        </div>
      ) : (
        <div className="customer-vehicles-table-wrapper">

          <table className="customer-vehicles-table">

            <thead>
              <tr>
                <th>Year</th>
                <th>Make</th>
                <th>Model</th>
                <th>Rego</th>
                <th>Mileage (km)</th>
                <th>Next WoF</th>
                <th>Next Oil Change</th>
              </tr>
            </thead>

            <tbody>
              {vehicles.map((vehicle) => {
                const wofInfo = getDateStatus(vehicle.nextWofDate);
                const oilInfo = getDateStatus(vehicle.nextOilChangeDate);

                return (
                  <tr key={vehicle.id}>

                    <td>
                      {vehicle.year || "—"}
                    </td>

                    <td>
                      {vehicle.make || "—"}
                    </td>

                    <td>
                      {vehicle.model || "—"}
                    </td>

                    <td>
                      {vehicle.rego || "—"}
                    </td>

                    <td>
                      {vehicle.mileage != null
                        ? vehicle.mileage.toLocaleString()
                        : "—"}
                    </td>

                    <td className={dateClassName(wofInfo.status)}>
                      {formatDate(vehicle.nextWofDate)}
                      {wofInfo.status === "overdue" && ` (${wofInfo.daysOut} days Overdue)`}
                      {wofInfo.status === "upcoming" && ` (Due in ${wofInfo.daysOut} days)`}
                    </td>

                    <td className={dateClassName(oilInfo.status)}>
                      {formatDate(vehicle.nextOilChangeDate)}
                      {oilInfo.status === "overdue" && ` (${oilInfo.daysOut} days Overdue)`}
                      {oilInfo.status === "upcoming" && ` (Due in ${oilInfo.daysOut} days)`}
                    </td>

                  </tr>
                );
              })}
            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}

export default CustomerVehiclesPage;