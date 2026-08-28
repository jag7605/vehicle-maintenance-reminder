import { useCustomerAppointments } from "../hooks/useCustomerAppointments";
import BookingCalendarPicker from "../component/customerAppointments/BookingCalendarPicker";
import SlotBookingForm from "../component/customerAppointments/SlotBookingForm";
import UpcomingAppointmentsList from "../component/customerAppointments/UpcomingAppointmentsList";
import MessagePopup from "../component/MessagePopup";
import "./CustomerAppointmentsPage.css";

function CustomerAppointmentsPage() {
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
    await handleBookAppointment();
  }

  return (
    <div className="customer-appointments-page">

      <h1 className="customer-appointments-title">
        Appointments
      </h1>

      <MessagePopup
        message={error}
        isError
        onClose={() => setError("")}
      />

      <MessagePopup
        message={bookingMessage}
        onClose={() => setBookingMessage("")}
      />


      <div className="customer-appointments-layout">

        <div className="customer-new-appointment">

          <div className="customer-appointment-section-header">

            <p className="customer-appointment-label">
              NEW APPOINTMENT
            </p>

            <p className="customer-appointment-description">
            </p>

          </div>


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

        </div>

        <div className="customer-upcoming-appointments">
          

          <div className="customer-appointment-section-header">

            <p className="customer-appointment-label">
              UPCOMING APPOINTMENTS
            </p>

          </div>


          <UpcomingAppointmentsList
            appointments={upcomingAppointments}
            onCancel={handleCancelAppointment}
          />

        </div>


      </div>

    </div>
  );
}

export default CustomerAppointmentsPage;