import { useState } from "react";
import { Calendar, dateFnsLocalizer } from "react-big-calendar";
import format from "date-fns/format";
import parse from "date-fns/parse";
import startOfWeek from "date-fns/startOfWeek";
import getDay from "date-fns/getDay";
import enNZ from "date-fns/locale/en-NZ";
import "react-big-calendar/lib/css/react-big-calendar.css";

const locales = { "en-NZ": enNZ };

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }), // Monday
  getDay,
  locales,
});

const CALENDAR_MIN_TIME = new Date(1970, 0, 1, 9, 0, 0); // 9am
const CALENDAR_MAX_TIME = new Date(1970, 0, 1, 17, 0, 0); // 5pm

const STATUS_COLORS = {
  pending: "#f59e0b", // amber — needs admin action
  confirmed: "#2563eb", // blue — booked, upcoming
  completed: "#16a34a", // green — done
  rejected: "#9ca3af", // grey — declined
  cancelled: "#9ca3af", // grey — customer cancelled
};

function formatStatus(status) {
  if (!status) return "";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function appointmentToEvent(appointment) {
  const start =
    typeof appointment.date?.toDate === "function"
      ? appointment.date.toDate()
      : new Date(appointment.date);

  // Fixed 1-hour slots per workingHours.js (SLOT_DURATION_MINUTES = 60)
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  const additional = appointment.additionalServiceTypes || [];
  const primaryLabel = appointment.serviceType || "Service";
  const serviceLabel =
    additional.length > 0
      ? `${primaryLabel} +${additional.length} more`
      : primaryLabel;

  return {
    id: appointment.id,
    title: `${serviceLabel} — ${appointment.customerName}`,
    start,
    end,
    status: appointment.status,
  };
}

function eventPropGetter(event) {
  return {
    style: {
      backgroundColor: STATUS_COLORS[event.status] || "#6b7280",
      borderRadius: "4px",
      border: "none",
      color: "white",
    },
  };
}

function BookingCalendar({ appointments, onSelectEvent }) {
  // Calendar must be controlled (date + view + onNavigate + onView) or the
  // toolbar's Next/Back/Month/Week/Day buttons have no state to update and
  // silently do nothing — same reason CustomerAppointmentsPage.jsx's
  // calendar already works, since it controls these explicitly.
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState("week");

  // Rejected bookings never occupied a real slot from the customer's
  // perspective going forward, so drop them from the grid entirely instead
  // of showing a greyed-out event. They're still in Firestore for records —
  // just not rendered here.
  const events = appointments
    .filter((appointment) => appointment.status !== "rejected")
    .map(appointmentToEvent);

  return (
    <div style={{ height: "700px" }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={calendarDate}
        view={calendarView}
        views={["month", "week", "day"]}
        onNavigate={(newDate) => setCalendarDate(newDate)}
        onView={(newView) => setCalendarView(newView)}
        min={CALENDAR_MIN_TIME}
        max={CALENDAR_MAX_TIME}
        eventPropGetter={eventPropGetter}
        onSelectEvent={onSelectEvent}
        popup
      />

      {/* Legend — status colour key. "rejected" isn't listed since those
          events are filtered off the calendar entirely. */}
      <div style={{ display: "flex", gap: "16px", marginTop: "12px", fontSize: "14px" }}>
        {Object.entries(STATUS_COLORS)
          .filter(([status]) => status !== "rejected")
          .map(([status, color]) => (
          <span key={status} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                display: "inline-block",
                width: "12px",
                height: "12px",
                borderRadius: "3px",
                backgroundColor: color,
              }}
            />
            {formatStatus(status)}
          </span>
        ))}
      </div>
    </div>
  );
}

export default BookingCalendar;