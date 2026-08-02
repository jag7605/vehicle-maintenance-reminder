import { useState } from "react";
import { useCustomerAppointments } from "../hooks/useCustomerAppointments";
import BookingCalendarPicker from "../component/customerAppointments/BookingCalendarPicker";
import SlotBookingForm from "../component/customerAppointments/SlotBookingForm";
import UpcomingAppointmentsList from "../component/customerAppointments/UpcomingAppointmentsList";
import MessagePopup from "../component/MessagePopup";
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
    additionalServiceTypes,
    setAdditionalServiceTypes,
    notes,
    setNotes,
    bookingLoading,
    handleBookAppointment,

    upcomingAppointments,
    handleCancelAppointment,

    error,
    setError,
    bookingMessage,
    setBookingMessage,
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

      <MessagePopup message={error} isError onClose={() => setError("")} />
      <MessagePopup message={bookingMessage} onClose={() => setBookingMessage("")} />

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
            additionalServiceTypes={additionalServiceTypes}
            setAdditionalServiceTypes={setAdditionalServiceTypes}
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