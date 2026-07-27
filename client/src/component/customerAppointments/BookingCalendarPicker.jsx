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
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

function BookingCalendarPicker({ onSelectSlot, dayPropGetter }) {
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState("month");

  return (
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
        onSelectSlot={onSelectSlot}
        dayPropGetter={dayPropGetter}
      />
    </div>
  );
}

export default BookingCalendarPicker;