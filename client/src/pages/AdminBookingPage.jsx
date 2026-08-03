import { useState } from "react";
import StaffLayout from "../component/StaffLayout";
import BookingCalendar from "../component/booking/BookingCalendar";
import BookingDetailModal from "../component/booking/BookingDetailModal";
import AdminCreateBookingModal from "../component/booking/AdminCreateBookingModal";
import { useAdminBookings } from "../hooks/useAdminBookings";

function AdminBookingPage() {
  const {
    appointments,
    loading,
    error,
    actionLoading,
    actionError,
    changeStatus,
    refresh,
  } = useAdminBookings();

  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Look the selected appointment up fresh each render so the modal reflects
  // status changes immediately (e.g. after Confirm, it flips to showing
  // "Mark Completed" instead of Confirm/Reject).
  const selectedAppointment = appointments.find(
    (a) => a.id === selectedAppointmentId
  );

  function handleSelectEvent(event) {
    setSelectedAppointmentId(event.id);
  }

  function closeModal() {
    setSelectedAppointmentId(null);
  }

  async function handleBookingCreated() {
    setShowCreateModal(false);
    await refresh();
  }

  return (
    <StaffLayout title="Bookings">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2>Bookings</h2>
        <button onClick={() => setShowCreateModal(true)}>+ New Booking</button>
      </div>

      {loading && <p>Loading bookings...</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {!loading && !error && (
        <BookingCalendar
          appointments={appointments}
          onSelectEvent={handleSelectEvent}
        />
      )}

      {selectedAppointment && (
        <BookingDetailModal
          appointment={selectedAppointment}
          onClose={closeModal}
          onConfirm={() => changeStatus(selectedAppointment.id, "confirmed")}
          onReject={() => changeStatus(selectedAppointment.id, "rejected")}
          loading={actionLoading[selectedAppointment.id]}
          error={actionError[selectedAppointment.id]}
        />
      )}

      {showCreateModal && (
        <AdminCreateBookingModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleBookingCreated}
        />
      )}
    </StaffLayout>
  );
}

export default AdminBookingPage;