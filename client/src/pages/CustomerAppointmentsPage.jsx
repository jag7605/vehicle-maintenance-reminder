import { useEffect, useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enNZ from "date-fns/locale/en-NZ";
import { db } from "../firebase/firebaseConfig";
import {
  getAvailability,
  createAppointment,
  getAppointmentsByCustomer,
  cancelAppointment,
} from "../firebase/appointments";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./CustomerAppointmentsPage.css";

const locales = {
  "en-NZ": enNZ,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

const SERVICE_TYPES = [
  "WOF",
  "Oil Change",
  "General Service",
  "Brake Check",
  "Tyre Check",
  "Other",
];

function CustomerAppointmentsPage() {
  const [activeTab, setActiveTab] = useState("book");

  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState("month");

  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState("");
  const [availability, setAvailability] = useState(null);

  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");

  const [upcomingAppointments, setUpcomingAppointments] = useState([]);

  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingMessage, setBookingMessage] = useState("");

  useEffect(() => {
    async function loadPageData() {
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          setError("You must be logged in to book an appointment.");
          return;
        }

        const vehiclesQuery = query(
          collection(db, "vehicles"),
          where("ownerId", "==", user.uid)
        );

        const vehicleSnapshot = await getDocs(vehiclesQuery);

        const vehicleList = vehicleSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setVehicles(vehicleList);

        await loadUpcomingAppointments(user.uid, vehicleList);
      } catch (error) {
        console.error("Could not load page data:", error);
        setError("Could not load your appointment details.");
      }
    }

    loadPageData();
  }, []);

  function getToday() {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  function isPastDate(date) {
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    return dateOnly < getToday();
  }

  function isSunday(date) {
    return date.getDay() === 0;
  }

  function isSameDay(date1, date2) {
    return (
      date1 &&
      date2 &&
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }

  function formatDateForApi(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function formatDisplayDate(date) {
    return date.toLocaleDateString("en-NZ", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatAppointmentDate(date) {
    return date.toLocaleString("en-NZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function dayPropGetter(date) {
    if (isPastDate(date) || isSunday(date)) {
      return {
        className: "blocked-day",
      };
    }

    if (isSameDay(date, selectedDate)) {
      return {
        className: "selected-day",
      };
    }

    return {};
  }

  async function loadAvailability(date) {
    try {
      setLoading(true);
      setError("");

      const dateString = formatDateForApi(date);
      const data = await getAvailability(dateString);

      setAvailability(data);
    } catch (error) {
      console.error("Could not load availability:", error);
      setError("Could not load available appointment slots.");
    } finally {
      setLoading(false);
    }
  }

  async function loadUpcomingAppointments(customerId, vehicleList = vehicles) {
    try {
      const appointments = await getAppointmentsByCustomer(customerId);
      const now = new Date();

      const upcoming = appointments
        .filter((appointment) => {
          const appointmentDate = appointment.date?.toDate
            ? appointment.date.toDate()
            : new Date(appointment.date);

          const isUpcoming = appointmentDate >= now;
          const isActive =
            appointment.status === "pending" ||
            appointment.status === "confirmed";

          return isUpcoming && isActive;
        })
        .map((appointment) => {
          const appointmentDate = appointment.date?.toDate
            ? appointment.date.toDate()
            : new Date(appointment.date);

          const vehicle = vehicleList.find(
            (vehicle) => vehicle.id === appointment.vehicleId
          );

          let vehicleName = "Vehicle";

          if (vehicle) {
            const plate = vehicle.plate || vehicle.registration || vehicle.rego;

            vehicleName = plate
              ? `${vehicle.make} ${vehicle.model} - ${plate}`
              : `${vehicle.make} ${vehicle.model}`;
          }

          return {
            ...appointment,
            appointmentDate,
            vehicleName,
          };
        });

      setUpcomingAppointments(upcoming);
    } catch (error) {
      console.error("Could not load upcoming appointments:", error);
    }
  }

  async function handleSelectDate(slotInfo) {
    const clickedDate = new Date(
      slotInfo.start.getFullYear(),
      slotInfo.start.getMonth(),
      slotInfo.start.getDate()
    );

    setBookingMessage("");

    if (isPastDate(clickedDate)) {
      setSelectedDate(null);
      setSelectedSlot("");
      setAvailability(null);
      setError("You cannot select a past date.");
      return;
    }

    if (isSunday(clickedDate)) {
      setSelectedDate(null);
      setSelectedSlot("");
      setAvailability(null);
      setError("The garage is closed on Sundays.");
      return;
    }

    setSelectedDate(clickedDate);
    setSelectedSlot("");

    await loadAvailability(clickedDate);
  }

  async function handleBookAppointment() {
    try {
      setError("");
      setBookingMessage("");

      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setError("You must be logged in to book an appointment.");
        return;
      }

      if (!selectedDate) {
        setError("Please select a date.");
        return;
      }

      if (!selectedSlot) {
        setError("Please select an available time slot.");
        return;
      }

      if (!selectedVehicleId) {
        setError("Please select a vehicle.");
        return;
      }

      if (!serviceType) {
        setError("Please select a service type.");
        return;
      }

      setBookingLoading(true);

      const latestAvailability = await getAvailability(
        formatDateForApi(selectedDate)
      );

      const slotStillAvailable = latestAvailability.slots.some(
        (slot) => slot.time === selectedSlot && slot.available
      );

      if (!slotStillAvailable) {
        setAvailability(latestAvailability);
        setSelectedSlot("");
        setError("This slot is no longer available. Please choose another slot.");
        return;
      }

      const [hour, minute] = selectedSlot.split(":").map(Number);

      const appointmentDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate(),
        hour,
        minute
      );

      const bookingNotes = notes.trim()
        ? `${serviceType} - ${notes.trim()}`
        : serviceType;

      await createAppointment(
        user.uid,
        selectedVehicleId,
        appointmentDate,
        bookingNotes
      );

      setBookingMessage("Appointment booking request submitted.");
      setSelectedSlot("");
      setServiceType("");
      setNotes("");

      await loadAvailability(selectedDate);
      await loadUpcomingAppointments(user.uid);

      setActiveTab("upcoming");
    } catch (error) {
      console.error("Could not book appointment:", error);
      setError(error.message || "Could not book appointment. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  }

  function isWithinCancelWindow(date) {
    const now = new Date();
    const differenceHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60);

    return differenceHours < 24;
  }

  async function handleCancelAppointment(appointment) {
    try {
      setError("");
      setBookingMessage("");

      if (isWithinCancelWindow(appointment.appointmentDate)) {
        setError(
          "This appointment can no longer be cancelled online because it starts in less than 24 hours."
        );
        return;
      }

      const confirmCancel = window.confirm(
        "Are you sure you want to cancel this appointment?"
      );

      if (!confirmCancel) return;

      await cancelAppointment(appointment.id);

      setBookingMessage("Appointment cancelled successfully.");

      const auth = getAuth();
      const user = auth.currentUser;

      if (user) {
        await loadUpcomingAppointments(user.uid);
      }

      if (selectedDate) {
        await loadAvailability(selectedDate);
      }
    } catch (error) {
      console.error("Could not cancel appointment:", error);
      setError("Could not cancel appointment. Please try again.");
    }
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
          className={
            activeTab === "upcoming" ? "tab-button active-tab" : "tab-button"
          }
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

          <div className="calendar-wrapper">
            <Calendar
              localizer={localizer}
              events={[]}
              startAccessor="start"
              endAccessor="end"
              date={calendarDate}
              view={calendarView}
              views={["month", "week", "day"]}
              selectable
              onNavigate={(newDate) => setCalendarDate(newDate)}
              onView={(newView) => setCalendarView(newView)}
              onSelectSlot={handleSelectDate}
              dayPropGetter={dayPropGetter}
            />
          </div>

          {loading && <p>Loading available slots...</p>}

          {selectedDate && availability && (
            <div className="slots-section">
              <h2>Available slots for {formatDisplayDate(selectedDate)}</h2>

              {availability.closed && <p>The garage is closed on this day.</p>}

              {!availability.closed && availability.slots.length === 0 && (
                <p>No slots available for this date.</p>
              )}

              {!availability.closed && availability.slots.length > 0 && (
                <>
                  <div className="slot-buttons">
                    {availability.slots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        className={
                          selectedSlot === slot.time
                            ? "slot-button selected-slot"
                            : slot.available
                            ? "slot-button"
                            : "slot-button booked"
                        }
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(slot.time)}
                      >
                        {slot.time} {slot.available ? "" : "(Booked)"}
                      </button>
                    ))}
                  </div>

                  <div className="booking-form">
                    <label>
                      Select vehicle:
                      <select
                        value={selectedVehicleId}
                        onChange={(event) =>
                          setSelectedVehicleId(event.target.value)
                        }
                      >
                        <option value="">Choose a vehicle</option>

                        {vehicles.map((vehicle) => (
                          <option key={vehicle.id} value={vehicle.id}>
                            {vehicle.make} {vehicle.model} -{" "}
                            {vehicle.plate ||
                              vehicle.registration ||
                              vehicle.rego ||
                              vehicle.id}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Service type:
                      <select
                        value={serviceType}
                        onChange={(event) => setServiceType(event.target.value)}
                      >
                        <option value="">Choose a service type</option>

                        {SERVICE_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </label>

                    <label>
                      Notes:
                      <textarea
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                        placeholder="Optional notes"
                      />
                    </label>

                    <button
                      type="button"
                      className="book-button"
                      onClick={handleBookAppointment}
                      disabled={bookingLoading}
                    >
                      {bookingLoading ? "Booking..." : "Book Appointment"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </>
      )}

      {activeTab === "upcoming" && (
        <div className="upcoming-list">
          <h2>My Upcoming Appointments</h2>

          {upcomingAppointments.length === 0 ? (
            <p>You have no upcoming appointments.</p>
          ) : (
            upcomingAppointments.map((appointment) => (
              <div key={appointment.id} className="upcoming-appointment-item">
                <div>
                  <strong>{appointment.vehicleName}</strong>

                  <p>{formatAppointmentDate(appointment.appointmentDate)}</p>

                  <p>Status: {appointment.status}</p>

                  <p>{appointment.notes || "Service appointment"}</p>
                </div>

                <button
                  type="button"
                  className="cancel-button"
                  onClick={() => handleCancelAppointment(appointment)}
                >
                  Cancel
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default CustomerAppointmentsPage;