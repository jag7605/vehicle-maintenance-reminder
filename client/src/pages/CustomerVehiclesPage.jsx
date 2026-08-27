import { useEffect, useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { getVehiclesByOwner } from "../firebase/vehicles";
import { formatDate } from "../utils/formatters";
import "./CustomerVehiclesPage.css";

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
                <th>Next Service (km)</th>
              </tr>
            </thead>

            <tbody>
              {vehicles.map((vehicle) => (
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

                  <td>
                    {formatDate(vehicle.nextWofDate)}
                  </td>

                  <td>
                    {formatDate(vehicle.nextOilChangeDate)}
                  </td>

                  <td>
                    {vehicle.nextServiceMileage != null
                      ? `${vehicle.nextServiceMileage.toLocaleString()} km`
                      : "—"}
                  </td>

                </tr>
              ))}
            </tbody>

          </table>

        </div>
      )}

    </div>
  );
}

export default CustomerVehiclesPage;