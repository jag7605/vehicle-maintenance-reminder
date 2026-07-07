import { useAdminCustomers } from "../hooks/useAdminCustomers";
import StaffLayout from "../component/StaffLayout";
import CustomerTable from "../component/adminCustomers/CustomerTable";
import SignUpModal from "../component/adminCustomers/SignUpModal";

// ---------------------------------------------------------------------------
// Admin Customers page.
//
// All state, filtering, and Firebase calls live in useAdminCustomers(). This
// component just renders the tab/search controls, the table, and the popup.
// ---------------------------------------------------------------------------
function AdminCustomerPage() {
  const {
    loading,
    error,
    filteredRows,
    statusTab,
    setStatusTab,
    searchTerm,
    setSearchTerm,
    signUpPopup,
  } = useAdminCustomers();

  if (loading) return <p>Loading customers...</p>;
  if (error) return <p style={{ color: "red" }}>{error}</p>;

  return (
    <StaffLayout title="Customers">
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2>Customers</h2>
          <button onClick={signUpPopup.open}>Sign Up New Customer</button>
        </div>

        <div>
          <button onClick={() => setStatusTab("active")} disabled={statusTab === "active"}>
            Active
          </button>{" "}
          <button onClick={() => setStatusTab("inactive")} disabled={statusTab === "inactive"}>
            Inactive
          </button>{" "}
          <button onClick={() => setStatusTab("all")} disabled={statusTab === "all"}>
            All
          </button>
        </div>

        <input
          type="text"
          placeholder="Search by name, phone, email, or rego"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <CustomerTable rows={filteredRows} />

        <SignUpModal popup={signUpPopup} />
      </div>
    </StaffLayout>
  );
}

export default AdminCustomerPage;