function formatAppointmentDate(date) {
  return date.toLocaleString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function UpcomingAppointmentsList({ appointments, onCancel }) {
  return (
    <div className="upcoming-list">
      <h2>My Upcoming Appointments</h2>

      {appointments.length === 0 ? (
        <p>You have no upcoming appointments.</p>
      ) : (
        appointments.map((appointment) => {
          const allServiceTypes = [
            appointment.serviceType,
            ...(appointment.additionalServiceTypes || []),
          ].filter(Boolean);

          return (
            <div key={appointment.id} className="upcoming-appointment-item">
              <div>
                <strong>{appointment.vehicleName}</strong>

                <p>{formatAppointmentDate(appointment.appointmentDate)}</p>

                <p>Status: {appointment.status}</p>

                <p>
                  {allServiceTypes.length > 0
                    ? allServiceTypes.join(", ")
                    : "Service appointment"}
                </p>

                {appointment.notes && <p>{appointment.notes}</p>}
              </div>

              <button
                type="button"
                className="cancel-button"
                onClick={() => onCancel(appointment)}
              >
                Cancel
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

export default UpcomingAppointmentsList;