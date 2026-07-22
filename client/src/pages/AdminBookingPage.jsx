import { useState } from "react";
import StaffLayout from "../component/StaffLayout";
import BookingCalendar from "../component/booking/BookingCalendar";
import BookingDetailModal from "../component/booking/BookingDetailModal";
import { useAdminBookings } from "../hooks/useAdminBookings";

function AdminBookingPage() {
  const {
    appointments,
    loading,
    error,
    actionLoading,
    actionError,
    changeStatus,
  } = useAdminBookings();

  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);

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

  return (
    <StaffLayout title="Bookings">
      <h2>Bookings</h2>

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
          onComplete={() => changeStatus(selectedAppointment.id, "completed")}
          loading={actionLoading[selectedAppointment.id]}
          error={actionError[selectedAppointment.id]}
        />
      )}
    </StaffLayout>
  );
}

export default AdminBookingPage;