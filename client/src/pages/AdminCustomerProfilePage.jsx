import { useParams, useNavigate } from "react-router-dom";
import StaffLayout from "../component/StaffLayout";
import TableCard from "../component/TableCard";
import { useCustomerProfile } from "../hooks/useCustomerProfile";
import VehicleTable from "../component/customerProfile/VehicleTable";
import AddVehicleForm from "../component/customerProfile/AddVehicleForm";
import EditVehicleModal from "../component/customerProfile/EditVehicleModal";
import DeleteVehicleModal from "../component/customerProfile/DeleteVehicleModal";
import StatusConfirmModal from "../component/customerProfile/StatusConfirmModal";
import SendNotificationModal from "../component/customerProfile/Sendnotificationmodal";
import "./AdminCustomerProfilePage.css";

function AdminCustomerProfilePage() {
  const { customerId } = useParams();
  const navigate = useNavigate();

  const {
    customer,
    vehicles,
    pageLoading,
    pageError,
    isActive,
    addVehicleForm,
    editPopup,
    deletePopup,
    statusPopup,
    notifyPopup,
    reminderLoading,
    reminderResult,
    expandedHistory,
    toggleHistory,
  } = useCustomerProfile(customerId);

  if (pageLoading) {
    return <p>Loading customer...</p>;
  }

  if (pageError) {
    return <p className="error-text">{pageError}</p>;
  }

  return (
    <StaffLayout title="Customers">
      <div className="admin-customer-profile-page">
        {/* CUSTOMER INFORMATION */}
        <div className="card admin-customer-profile-card">
          <div className="admin-customer-profile-main">
            <div className="admin-customer-avatar">
              {customer.firstName?.charAt(0)}
              {customer.lastName?.charAt(0)}
            </div>

            <div className="admin-customer-profile-info">
              <div className="profile-header-row">
                <h2>
                  {customer.firstName} {customer.lastName}
                </h2>

                <span className={`badge ${isActive ? "status-active" : "status-inactive"}`}>
                  {isActive ? "Active" : "Inactive"}
                </span>
              </div>

              <p>{customer.email}</p>
              <p>{customer.phone}</p>
            </div>
          </div>

          <div className="admin-customer-profile-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/admin/customers")}
            >
              ← Back to Customers
            </button>

            <button
              type="button"
              className={`btn ${statusPopup.loading ? "btn-disabled" : isActive ? "btn-danger" : "btn-primary"}`}
              onClick={statusPopup.open}
              disabled={statusPopup.loading}
            >
              {statusPopup.loading ? "Updating..." : isActive ? "Deactivate" : "Activate"}
            </button>
          </div>
        </div>

        {/* CURRENT VEHICLES */}
        <div className="card admin-current-vehicles-card">
          <div className="admin-section-header">
            <h2>Current Vehicles</h2>

            <span className="admin-vehicle-count">
              {vehicles.length} {vehicles.length === 1 ? "vehicle" : "vehicles"}
            </span>
          </div>

          <div className="admin-current-vehicles-content">
            <TableCard>
              <VehicleTable
                vehicles={vehicles}
                reminderLoading={reminderLoading}
                reminderResult={reminderResult}
                expandedHistory={expandedHistory}
                onEdit={editPopup.open}
                onDelete={deletePopup.open}
                onOpenNotify={notifyPopup.open}
                onToggleHistory={toggleHistory}
              />
            </TableCard>
          </div>
        </div>

        {/* MODALS */}
        <EditVehicleModal popup={editPopup} />
        <DeleteVehicleModal popup={deletePopup} />
        <StatusConfirmModal popup={statusPopup} customer={customer} isActive={isActive} />
        <SendNotificationModal popup={notifyPopup} />

        {/* ADD VEHICLE */}
        <div className="card admin-add-vehicle-card">
          <p className="admin-add-vehicle-label">ADD VEHICLE</p>

          {/* <h2 className="admin-add-vehicle-heading">
            Add Vehicle for {customer.firstName} {customer.lastName}
          </h2> */}

          <AddVehicleForm
            customerName={`${customer.firstName} ${customer.lastName}`}
            form={addVehicleForm}
          />
        </div>
      </div>
    </StaffLayout>
  );
}

export default AdminCustomerProfilePage;