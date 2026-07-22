import { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enNZ from "date-fns/locale/en-NZ";
import { getAvailability } from "../firebase/appointments";
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

function CustomerAppointmentsPage() {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState("month");

  const [selectedDate, setSelectedDate] = useState(null);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function getTodayDateOnly() {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  function isPastDate(date) {
    const dateOnly = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );

    return dateOnly < getTodayDateOnly();
  }

  function isSunday(date) {
    return date.getDay() === 0;
  }

  function isDateBlocked(date) {
    return isPastDate(date) || isSunday(date);
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

  function dayPropGetter(date) {
    if (isDateBlocked(date)) {
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
      console.error(error);
      setError("Could not load available appointment slots.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectSlot(slotInfo) {
    const clickedDate = new Date(
      slotInfo.start.getFullYear(),
      slotInfo.start.getMonth(),
      slotInfo.start.getDate()
    );

    if (isPastDate(clickedDate)) {
      setSelectedDate(null);
      setAvailability(null);
      setError("You cannot select a past date.");
      return;
    }

    if (isSunday(clickedDate)) {
      setSelectedDate(null);
      setAvailability(null);
      setError("The garage is closed on Sundays.");
      return;
    }

    setSelectedDate(clickedDate);
    await loadAvailability(clickedDate);
  }

  return (
    <div className="customer-appointments-page">
      <h1>Book Appointment</h1>

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
          onSelectSlot={handleSelectSlot}
          dayPropGetter={dayPropGetter}
        />
      </div>

      {loading && <p>Loading available slots...</p>}

      {error && <p className="error-message">{error}</p>}

      {selectedDate && availability && (
        <div className="slots-section">
          <h2>Available slots for {formatDisplayDate(selectedDate)}</h2>

          {availability.closed && <p>The garage is closed on this day.</p>}

          {!availability.closed && availability.slots.length === 0 && (
            <p>No slots available for this date.</p>
          )}

          {!availability.closed && availability.slots.length > 0 && (
            <div className="slot-buttons">
              {availability.slots.map((slot) => (
                <button
                  key={slot.time}
                  type="button"
                  className={slot.available ? "slot-button" : "slot-button booked"}
                  disabled={!slot.available}
                >
                  {slot.time} {slot.available ? "" : "(Booked)"}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CustomerAppointmentsPage;