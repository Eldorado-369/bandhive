import React from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

const BookingCalendar = ({ bookings, onSelectEvent }) => {
  const localizer = momentLocalizer(moment);

  const events = bookings.map((booking) => ({
    id: booking.id,
    title: booking.event_type,
    start: moment(booking.event_date).toDate(),
    end: moment(booking.event_date).toDate(),
    allDay: true,
    details: booking,
  }));

  return (
    <div style={{ height: 500, border: "1px solid red" }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        selectable
        onSelectEvent={onSelectEvent}
      />
    </div>
  );
};

export default BookingCalendar;
