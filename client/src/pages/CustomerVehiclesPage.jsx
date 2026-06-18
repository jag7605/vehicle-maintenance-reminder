import { useEffect, useState } from "react";
import { auth } from "../firebase/firebaseConfig";
import { getVehiclesByOwner } from "../firebase/vehicles";

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

  if (status === "loading") return <p>Loading vehicles...</p>;
  if (status === "error") return <p>Something went wrong. Please try again.</p>;
  if (vehicles.length === 0) return <p>No vehicles found.</p>;

  return (
    <div>
      <h2>My Vehicles</h2>
      <table>
        <thead>
          <tr>
            <th>Year</th>
            <th>Make</th>
            <th>Model</th>
            <th>Rego</th>
            <th>Mileage</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((vehicle) => (
            <tr key={vehicle.id}>
              <td>{vehicle.year}</td>
              <td>{vehicle.make}</td>
              <td>{vehicle.model}</td>
              <td>{vehicle.rego}</td>
              <td>{vehicle.mileage}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default CustomerVehiclesPage;