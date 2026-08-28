import "./UpcomingAppointmentsList.css";

function formatAppointmentDate(date) {
  return date.toLocaleString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatStatus(status) {
  if (!status) return "";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function UpcomingAppointmentsList({ appointments, onCancel }) {
  return (
    <div className="upcoming-list">
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

                <p className="appointment-meta">{formatAppointmentDate(appointment.appointmentDate)}</p>

                <p className={`appointment-meta appointment-status ${appointment.status?.toLowerCase()}`}>
                  Status: {formatStatus(appointment.status)}
                </p>

                <p className="appointment-meta">
                  {allServiceTypes.length > 0
                    ? allServiceTypes.join(", ")
                    : "Service appointment"}
                </p>

                {appointment.notes && <p className="appointment-notes">{appointment.notes}</p>}
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