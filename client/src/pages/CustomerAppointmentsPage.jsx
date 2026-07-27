import { useState } from "react";
import { useCustomerAppointments } from "../hooks/useCustomerAppointments";
import BookingCalendarPicker from "../component/customerAppointments/BookingCalendarPicker";
import SlotBookingForm from "../component/customerAppointments/SlotBookingForm";
import UpcomingAppointmentsList from "../component/customerAppointments/UpcomingAppointmentsList";
import "./CustomerAppointmentsPage.css";

function CustomerAppointmentsPage() {
  const [activeTab, setActiveTab] = useState("book");

  const {
    selectedDate,
    selectedSlot,
    setSelectedSlot,
    availability,
    loading,
    dayPropGetter,
    handleSelectDate,

    vehicles,
    selectedVehicleId,
    setSelectedVehicleId,
    serviceType,
    setServiceType,
    notes,
    setNotes,
    bookingLoading,
    handleBookAppointment,

    upcomingAppointments,
    handleCancelAppointment,

    error,
    bookingMessage,
  } = useCustomerAppointments();

  async function handleBook() {
    const success = await handleBookAppointment();
    if (success) setActiveTab("upcoming");
  }

  return (
    <div className="customer-appointments-page">
      <h1>Appointments</h1>

      <div className="appointment-tabs">
        <button
          type="button"
          className={activeTab === "book" ? "tab-button active-tab" : "tab-button"}
          onClick={() => setActiveTab("book")}
        >
          Book Appointment
        </button>

        <button
          type="button"
          className={activeTab === "upcoming" ? "tab-button active-tab" : "tab-button"}
          onClick={() => setActiveTab("upcoming")}
        >
          My Upcoming Appointments
        </button>
      </div>

      {error && <p className="error-message">{error}</p>}
      {bookingMessage && <p className="success-message">{bookingMessage}</p>}

      {activeTab === "book" && (
        <>
          <p>Select a date on the calendar to view available appointment slots.</p>

          <BookingCalendarPicker
            onSelectSlot={handleSelectDate}
            dayPropGetter={dayPropGetter}
          />

          <SlotBookingForm
            selectedDate={selectedDate}
            availability={availability}
            loading={loading}
            selectedSlot={selectedSlot}
            setSelectedSlot={setSelectedSlot}
            vehicles={vehicles}
            selectedVehicleId={selectedVehicleId}
            setSelectedVehicleId={setSelectedVehicleId}
            serviceType={serviceType}
            setServiceType={setServiceType}
            notes={notes}
            setNotes={setNotes}
            bookingLoading={bookingLoading}
            onBook={handleBook}
          />
        </>
      )}

      {activeTab === "upcoming" && (
        <UpcomingAppointmentsList
          appointments={upcomingAppointments}
          onCancel={handleCancelAppointment}
        />
      )}
    </div>
  );
}

export default CustomerAppointmentsPage;