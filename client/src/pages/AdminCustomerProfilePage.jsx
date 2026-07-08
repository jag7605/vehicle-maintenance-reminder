import { useParams } from "react-router-dom";
import StaffLayout from "../component/StaffLayout";
import { useCustomerProfile } from "../hooks/useCustomerProfile";
import VehicleTable from "../component/customerProfile/VehicleTable";
import AddVehicleForm from "../component/customerProfile/AddVehicleForm";
import EditVehicleModal from "../component/customerProfile/EditVehicleModal";
import DeleteVehicleModal from "../component/customerProfile/DeleteVehicleModal";
import StatusConfirmModal from "../component/customerProfile/StatusConfirmModal";
import SendNotificationModal from "../component/customerProfile/SendNotificationModal";

// ---------------------------------------------------------------------------
// Admin Customer Profile page.
//
// All state and Firebase/API logic lives in useCustomerProfile(). This
// component's only job is to read values off the hook and hand them to the
// right presentational component — no business logic here.
// ---------------------------------------------------------------------------
function AdminCustomerProfilePage() {
  const { customerId } = useParams();
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

  if (pageLoading) return <p>Loading customer...</p>;
  if (pageError) return <p style={{ color: "red" }}>{pageError}</p>;

  return (
    <StaffLayout title="Customers">
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <h2>{customer.firstName} {customer.lastName}</h2>
          <span style={{ color: isActive ? "green" : "red" }}>
            {isActive ? "Active" : "Inactive"}
          </span>
          <button onClick={statusPopup.open} disabled={statusPopup.loading}>
            {statusPopup.loading ? "Updating..." : isActive ? "Deactivate" : "Activate"}
          </button>
        </div>

        <p>Email: {customer.email}</p>
        <p>Phone: {customer.phone}</p>

        <h3>Vehicles</h3>
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

        <EditVehicleModal popup={editPopup} />
        <DeleteVehicleModal popup={deletePopup} />
        <StatusConfirmModal popup={statusPopup} customer={customer} isActive={isActive} />
        <SendNotificationModal popup={notifyPopup} />

        <AddVehicleForm
          customerName={`${customer.firstName} ${customer.lastName}`}
          form={addVehicleForm}
        />
      </div>
    </StaffLayout>
  );
}

export default AdminCustomerProfilePage;