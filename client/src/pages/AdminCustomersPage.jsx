import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllCustomers } from "../firebase/users";
import { getAllVehicles } from "../firebase/vehicles";

function AdminCustomerPage() {
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [customerList, vehicleList] = await Promise.all([
          getAllCustomers(),
          getAllVehicles(),
        ]);

        // Build one row per vehicle. Customers with no vehicles get a single
        // row with blank vehicle columns, since accounts without a vehicle
        // are still possible for now.
        const builtRows = [];
        customerList.forEach((customer) => {
          const customerVehicles = vehicleList.filter((v) => v.ownerId === customer.id);

          if (customerVehicles.length === 0) {
            builtRows.push({ customer, vehicle: null });
          } else {
            customerVehicles.forEach((vehicle) => {
              builtRows.push({ customer, vehicle });
            });
          }
        });

        setRows(builtRows);
      } catch {
        setError("Failed to load customers.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const term = searchTerm.toLowerCase();

  const filteredRows = !term
    ? rows
    : (() => {
        // Customers whose name/phone/email matches the term: show ALL their rows
        const matchingCustomerIds = new Set(
          rows
            .filter(({ customer }) =>
              customer.firstName?.toLowerCase().includes(term) ||
              customer.lastName?.toLowerCase().includes(term) ||
              customer.email?.toLowerCase().includes(term) ||
              customer.phone?.toLowerCase().includes(term)
            )
            .map(({ customer }) => customer.id)
        );

        // A row qualifies if its customer matched on name/phone/email,
        // OR if its specific vehicle's rego matches (rego matches don't pull in siblings)
        return rows.filter(({ customer, vehicle }) => {
          const matchesCustomer = matchingCustomerIds.has(customer.id);
          const matchesRego = vehicle?.rego?.toLowerCase().includes(term);
          return matchesCustomer || matchesRego;
        });
      })();

  if (loading) return <p>Loading customers...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <div>
      <h2>Customers</h2>

      <input
        type="text"
        placeholder="Search by name, phone, email, or rego"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {filteredRows.length === 0 ? (
        <p>No results found.</p>
      ) : (
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Year</th>
              <th>Make</th>
              <th>Model</th>
              <th>Rego</th>
              <th>Mileage (KMs)</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map(({ customer, vehicle }) => (
              <tr key={vehicle ? vehicle.id : customer.id}>
                <td>
                  <Link to={`/admin/customers/${customer.id}`}>
                    {customer.firstName} {customer.lastName}
                  </Link>
                </td>
                <td>{customer.email}</td>
                <td>{customer.phone}</td>
                <td>{vehicle ? vehicle.year : "—"}</td>
                <td>{vehicle ? vehicle.make : "—"}</td>
                <td>{vehicle ? vehicle.model : "—"}</td>
                <td>{vehicle ? vehicle.rego : "—"}</td>
                <td>{vehicle ? vehicle.mileage : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminCustomerPage;