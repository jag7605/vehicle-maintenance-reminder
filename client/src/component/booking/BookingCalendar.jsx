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

function appointmentToEvent(appointment) {
  const start =
    typeof appointment.date?.toDate === "function"
      ? appointment.date.toDate()
      : new Date(appointment.date);

  // Fixed 1-hour slots per workingHours.js (SLOT_DURATION_MINUTES = 60)
  const end = new Date(start.getTime() + 60 * 60 * 1000);

  return {
    id: appointment.id,
    title: `${appointment.vehicleLabel} — ${appointment.customerName}`,
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
  const events = appointments.map(appointmentToEvent);

  return (
    <div style={{ height: "700px" }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView="week"
        views={["month", "week", "day"]}
        min={CALENDAR_MIN_TIME}
        max={CALENDAR_MAX_TIME}
        eventPropGetter={eventPropGetter}
        onSelectEvent={onSelectEvent}
        popup
      />

      {/* Legend — status colour key */}
      <div style={{ display: "flex", gap: "16px", marginTop: "12px", fontSize: "14px" }}>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
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
            {status}
          </span>
        ))}
      </div>
    </div>
  );
}

export default BookingCalendar;