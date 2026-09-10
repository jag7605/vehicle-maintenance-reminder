import { useNavigate } from "react-router-dom";
import TableCard from "../TableCard";

// ---------------------------------------------------------------------------
// Renders the filtered customer+vehicle rows. Pure presentational component.
// ---------------------------------------------------------------------------
function CustomerTable({ rows }) {
  const navigate = useNavigate();

  if (rows.length === 0) {
    return <p>No results found.</p>;
  }

  return (
    <TableCard>
      <table>
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
            <tr
              key={vehicle ? vehicle.id : customer.id}
              className="clickable-row"
              onClick={() => navigate(`/admin/customers/${customer.id}`)}
            >
              <td>{customer.firstName} {customer.lastName}</td>
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
    </TableCard>
  );
}

export default CustomerTable;