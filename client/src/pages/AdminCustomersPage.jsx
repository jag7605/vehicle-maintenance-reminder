import { useAdminCustomers } from "../hooks/useAdminCustomers";
import { usePagination } from "../hooks/usePagination";
import StaffLayout from "../component/StaffLayout";
import CustomerTable from "../component/adminCustomers/CustomerTable";
import SignUpModal from "../component/adminCustomers/SignUpModal";
import Pagination from "../component/Pagination";
import "./AdminCustomersPage.css";
import "../component/FormControls.css";

const PAGE_SIZE = 10;

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

  const { pageItems, currentPage, totalPages, setPage } = usePagination(filteredRows, PAGE_SIZE);

  if (loading) return <p>Loading customers...</p>;
  if (error) return <p className="error-text">{error}</p>;

  return (
    <StaffLayout title="Customers">
      <div>
        <div className="page-header">
          <h1>Customers</h1>
          <button className="btn btn-primary" onClick={signUpPopup.open}>
            Sign Up New Customer
          </button>
        </div>

        <div className="status-tab-row">
          <button
            className={`btn btn-sm ${statusTab === "active" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setStatusTab("active")}
            disabled={statusTab === "active"}
          >
            Active
          </button>
          <button
            className={`btn btn-sm ${statusTab === "inactive" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setStatusTab("inactive")}
            disabled={statusTab === "inactive"}
          >
            Inactive
          </button>
          <button
            className={`btn btn-sm ${statusTab === "all" ? "btn-primary" : "btn-secondary"}`}
            onClick={() => setStatusTab("all")}
            disabled={statusTab === "all"}
          >
            All
          </button>
        </div>

        <input
          type="text"
          className="input-control"
          placeholder="Search by name, phone, email, or rego"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <CustomerTable rows={pageItems} />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setPage}
        />

        <SignUpModal popup={signUpPopup} />
      </div>
    </StaffLayout>
  );
}

export default AdminCustomerPage;