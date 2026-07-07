import { Link } from "react-router-dom";

// ---------------------------------------------------------------------------
// Renders the filtered customer+vehicle rows. Pure presentational.
// ---------------------------------------------------------------------------
function CustomerTable({ rows }) {
  if (rows.length === 0) {
    return <p>No results found.</p>;
  }

  return (
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
        {rows.map(({ customer, vehicle }) => (
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
  );
}

export default CustomerTable;