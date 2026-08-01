import NotificationPopup from "../component/NotificationPopup";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebaseConfig";
import { getAppointmentsByCustomer } from "../firebase/appointments";
import "./CustomerHomepage.css";

function CustomerHomepage() {
  const navigate = useNavigate();

  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [appointmentError, setAppointmentError] = useState("");

  useEffect(() => {
    async function loadUpcomingAppointments() {
      try {
        setLoadingAppointments(true);
        setAppointmentError("");

        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          setAppointmentError("You must be logged in to view appointments.");
          return;
        }

        const appointments = await getAppointmentsByCustomer(user.uid);
        const now = new Date();
        const upcoming = [];

        for (const appointment of appointments) {
          const appointmentDate = appointment.date?.toDate
            ? appointment.date.toDate()
            : new Date(appointment.date);

          const isUpcoming = appointmentDate >= now;
          const isActive =
            appointment.status === "pending" ||
            appointment.status === "confirmed";

          if (isUpcoming && isActive) {
            let vehicleText = "Vehicle";

            try {
              const vehicleRef = doc(db, "vehicles", appointment.vehicleId);
              const vehicleSnap = await getDoc(vehicleRef);

              if (vehicleSnap.exists()) {
                const vehicle = vehicleSnap.data();

                const make = vehicle.make || "";
                const model = vehicle.model || "";
                const plate =
                  vehicle.plate || vehicle.registration || vehicle.rego;

                vehicleText = plate
                  ? `${make} ${model} - ${plate}`
                  : `${make} ${model}`;
              }
            } catch (error) {
              console.error("Could not load vehicle:", error);
            }

            upcoming.push({
              ...appointment,
              appointmentDate,
              vehicleText,
            });
          }
        }

        setUpcomingAppointments(upcoming);
      } catch (error) {
        console.error("Could not load appointments:", error);
        setAppointmentError("Could not load upcoming appointments.");
      } finally {
        setLoadingAppointments(false);
      }
    }

    loadUpcomingAppointments();
  }, []);

  function formatDate(date) {
    return date.toLocaleDateString("en-NZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(date) {
    return date.toLocaleTimeString("en-NZ", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatStatus(status) {
    if (!status) return "";
    return status.charAt(0).toUpperCase() + status.slice(1);
  }

  return (
    <>
      <NotificationPopup />

      <div className="customer-dashboard">
        <div className="upcoming-appointment-card">
          <div className="appointment-card-header">
            <h2>UPCOMING APPOINTMENT</h2>

            <button
              type="button"
              className="view-all-button"
              onClick={() => navigate("/customer/appointments")}
            >
              View all →
            </button>
          </div>

          {loadingAppointments && (
            <p className="appointment-message">Loading appointments...</p>
          )}

          {appointmentError && (
            <p className="appointment-error">{appointmentError}</p>
          )}

          {!loadingAppointments &&
            !appointmentError &&
            upcomingAppointments.length === 0 && (
              <p className="appointment-message">
                You have no upcoming appointments.
              </p>
            )}

          {!loadingAppointments &&
            !appointmentError &&
            upcomingAppointments.slice(0, 2).map((appointment) => (
              <div key={appointment.id} className="appointment-row">
                <div className="appointment-date">
                  <strong>{formatDate(appointment.appointmentDate)}</strong>
                  <br />
                  <strong>{formatTime(appointment.appointmentDate)}</strong>
                </div>

                <div className="appointment-details">
                  <strong>{appointment.vehicleText}</strong>
                  <br />
                  <span>
                    {[
                      appointment.serviceType,
                      ...(appointment.additionalServiceTypes || []),
                    ]
                      .filter(Boolean)
                      .join(", ") || "Service appointment"}
                  </span>
                  {appointment.notes && (
                    <>
                      <br />
                      <span className="appointment-notes">{appointment.notes}</span>
                    </>
                  )}
                </div>

                <span className={`status-badge ${appointment.status}`}>
                  {formatStatus(appointment.status)}
                </span>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}

export default CustomerHomepage;