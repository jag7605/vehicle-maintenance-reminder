import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllCustomers } from "../firebase/users";
import { getAllVehicles } from "../firebase/vehicles";
import { signUpCustomer } from "../firebase/auth";
import StaffLayout from "../component/StaffLayout";


function AdminCustomerPage() {
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState("active"); // "active" | "inactive" | "all"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sign-up popup state
  const [showSignUp, setShowSignUp] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [signUpError, setSignUpError] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);

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

  useEffect(() => {
    loadData();
  }, []);

  function openSignUpPopup() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setSignUpError("");
    setShowSignUp(true);
  }

  function closeSignUpPopup() {
    setShowSignUp(false);
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setSignUpError("");

    // Validation: non-empty names, email must contain "@", phone digits only
    if (!firstName.trim() || !lastName.trim()) {
      setSignUpError("First and last name are required.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setSignUpError("A valid email is required.");
      return;
    }
    if (!phone.trim() || !/^\d+$/.test(phone)) {
      setSignUpError("Phone must contain digits only.");
      return;
    }

    setSignUpLoading(true);
    try {
      await signUpCustomer({ firstName, lastName, email, phone });
      setShowSignUp(false);
      setLoading(true);
      await loadData(); // refresh the customer list so the new account appears
    } catch (err) {
      setSignUpError(err.message);
    } finally {
      setSignUpLoading(false);
    }
  }

  const term = searchTerm.toLowerCase();

  // Step 1: filter by active status tab.
  // Missing "active" field defaults to true (active), matching the
  // same default used in auth.js and AdminCustomerProfilePage.jsx
  const statusFilteredRows = rows.filter(({ customer }) => {
    const isActive = customer.active !== false;
    if (statusTab === "active") return isActive;
    if (statusTab === "inactive") return !isActive;
    return true; // "all"
  });

  // Step 2: apply the search term on top of the status-filtered rows
  const filteredRows = !term
    ? statusFilteredRows
    : (() => {
        // Customers whose name/phone/email matches the term: show ALL their rows
        const matchingCustomerIds = new Set(
          statusFilteredRows
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
        return statusFilteredRows.filter(({ customer, vehicle }) => {
          const matchesCustomer = matchingCustomerIds.has(customer.id);
          const matchesRego = vehicle?.rego?.toLowerCase().includes(term);
          return matchesCustomer || matchesRego;
        });
      })();

  if (loading) return <p>Loading customers...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <StaffLayout title="Customers">
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Customers</h2>
        <button onClick={openSignUpPopup}>Sign Up New Customer</button>
      </div>

      <div>
        <button
          onClick={() => setStatusTab("active")}
          disabled={statusTab === "active"}
        >
          Active
        </button>{" "}
        <button
          onClick={() => setStatusTab("inactive")}
          disabled={statusTab === "inactive"}
        >
          Inactive
        </button>{" "}
        <button
          onClick={() => setStatusTab("all")}
          disabled={statusTab === "all"}
        >
          All
        </button>
      </div>

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

      {showSignUp && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ backgroundColor: "white", padding: "20px", minWidth: "300px" }}>
            <h3>Sign Up New Customer</h3>
            <form onSubmit={handleSignUp}>
              <div>
                <label>First Name</label><br />
                <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
              </div>

              <div>
                <label>Last Name</label><br />
                <input value={lastName} onChange={(e) => setLastName(e.target.value)} />
              </div>

              <div>
                <label>Email</label><br />
                <input value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div>
                <label>Phone</label><br />
                <input value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              {signUpError && <p style={{ color: "red" }}>{signUpError}</p>}

              <button type="submit" disabled={signUpLoading}>
                {signUpLoading ? "Creating..." : "Create Account"}
              </button>{" "}
              <button type="button" onClick={closeSignUpPopup}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
    </StaffLayout>
  );
}

export default AdminCustomerPage;