import NotificationPopup from "../component/NotificationPopup";
import { useEffect, useState } from "react";
import { getAuth } from "firebase/auth";
import { collection, getDocs, query, where, } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { db } from "../firebase/firebaseConfig";
import { getAppointmentsByCustomer } from "../firebase/appointments";
import { getVehiclesByOwner } from "../firebase/vehicles";
import { getCustomerById } from "../firebase/users";
import "./CustomerHomepage.css";

function CustomerHomepage() {
  const navigate = useNavigate();

  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [attentionItems, setAttentionItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [recentService, setRecentService] = useState(null);
  const [firstName, setFirstName] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) {
          setError("You must be logged in to view the dashboard.");
          return;
        }

        const notificationsQuery = query(
          collection(db, "notifications"),
          where("customerId", "==", user.uid)
        );

        const [
          appointments,
          vehicles,
          notificationSnapshot,
          customerData,
        ] = await Promise.all([
          getAppointmentsByCustomer(user.uid),
          getVehiclesByOwner(user.uid),
          getDocs(notificationsQuery),
          getCustomerById(user.uid),
        ]);

        setFirstName(customerData?.firstName || "");

        const now = new Date();

        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        const dueSoonDate = new Date(today);
        dueSoonDate.setDate(dueSoonDate.getDate() + 30);

        const vehicleMap = new Map();

        vehicles.forEach((vehicle) => {
          vehicleMap.set(vehicle.id, vehicle);
        });

        /*
          Upcoming appointments
        */

        const futureBookings = appointments.filter((appointment) => {
          // eslint-disable-next-line react-hooks/immutability
          const appointmentDate = getDateValue(appointment.date);

          if (!appointmentDate) {
            return false;
          }

          const active =
            appointment.status === "pending" ||
            appointment.status === "confirmed";

          return active && appointmentDate >= now;
        });

        const upcoming = futureBookings
          .map((appointment) => {
            const vehicle = vehicleMap.get(appointment.vehicleId);

            return {
              ...appointment,
              appointmentDate: getDateValue(appointment.date),
              // eslint-disable-next-line react-hooks/immutability
              vehicleText: getVehicleText(vehicle),
            };
          })
          .sort(
            (a, b) =>
              a.appointmentDate.getTime() -
              b.appointmentDate.getTime()
          );

        setUpcomingAppointments(upcoming);

        /*
          New notifications
        */

        const unreadNotifications =
          notificationSnapshot.docs.filter((notificationDoc) => {
            return notificationDoc.data().read === false;
          });

        setUnreadCount(unreadNotifications.length);

        /*
          Recent service
        */

        const completedAppointments = appointments
          .filter((appointment) => {
            return appointment.status === "completed";
          })
          .sort((a, b) => {
            const dateA = getDateValue(a.date);
            const dateB = getDateValue(b.date);

            return dateB - dateA;
          });

        if (completedAppointments.length > 0) {
          const latestService = completedAppointments[0];

          const vehicle = vehicleMap.get(
            latestService.vehicleId
          );

          const serviceTypes = [
            latestService.serviceType,
            ...(latestService.additionalServiceTypes || []),
          ]
            .filter(Boolean)
            .join(", ");

          setRecentService({
            vehicleText: getVehicleText(vehicle),
            serviceTypes:
              serviceTypes || "Service appointment",
            date: getDateValue(latestService.date),
          });
        } else {
          setRecentService(null);
        }

        /*
          Vehicles needing attention
        */

        const attention = [];

        for (const vehicle of vehicles) {
          const vehicleBookings = futureBookings.filter(
            (appointment) =>
              appointment.vehicleId === vehicle.id
          );

          const bookedServices = [];

          vehicleBookings.forEach((appointment) => {
            const services = [
              appointment.serviceType,
              ...(appointment.additionalServiceTypes || []),
            ].filter(Boolean);

            bookedServices.push(...services);
          });

          const hasWofBooking = bookedServices.some(
            (service) =>
              service.toLowerCase() === "wof"
          );

          const hasOilBooking = bookedServices.some(
            (service) =>
              service.toLowerCase() === "oil change"
          );

          const nextWofDate = getDateValue(
            vehicle.nextWofDate
          );

          const nextOilChangeDate = getDateValue(
            vehicle.nextOilChangeDate
          );

          if (
            nextWofDate &&
            nextWofDate <= dueSoonDate &&
            !hasWofBooking
          ) {
            attention.push({
              vehicleText: getVehicleText(vehicle),
              service: "WoF",
              date: nextWofDate,
              overdue: nextWofDate < today,
            });
          }

          if (
            nextOilChangeDate &&
            nextOilChangeDate <= dueSoonDate &&
            !hasOilBooking
          ) {
            attention.push({
              vehicleText: getVehicleText(vehicle),
              service: "Oil Change",
              date: nextOilChangeDate,
              overdue: nextOilChangeDate < today,
            });
          }
        }

        attention.sort((a, b) => a.date - b.date);

        setAttentionItems(attention);
      } catch (error) {
        console.error("Could not load dashboard:", error);

        setError("Could not load dashboard information.");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  function getDateValue(value) {
    if (!value) {
      return null;
    }

    if (value.toDate) {
      return value.toDate();
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  function getVehicleText(vehicle) {
    if (!vehicle) {
      return "Vehicle";
    }

    const make = vehicle.make || "";
    const model = vehicle.model || "";

    const rego =
      vehicle.rego ||
      vehicle.plate ||
      vehicle.registration ||
      "";

    if (rego) {
      return `${make} ${model} - ${rego}`;
    }

    return `${make} ${model}`;
  }

  function formatDate(date) {
    if (!date) {
      return "";
    }

    return date.toLocaleDateString("en-NZ", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  function formatTime(date) {
    if (!date) {
      return "";
    }

    return date.toLocaleTimeString("en-NZ", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatStatus(status) {
    if (!status) {
      return "";
    }

    return (
      status.charAt(0).toUpperCase() +
      status.slice(1)
    );
  }

  return (
    <>
      <NotificationPopup />

      <div className="customer-home">

        <h1 className="customer-home-title">
          {firstName ? `Welcome, ${firstName}` : "Dashboard"}
        </h1>


        {error && (
          <p className="customer-home-error">
            {error}
          </p>
        )}

        <div className="customer-home-overview">

          {/* Needs Attention */}

          <div
            className="customer-home-overview-card"
            onClick={() => navigate("/customer/vehicles")}
          >
            <p className="customer-home-overview-label">
              NEEDS ATTENTION
            </p>

            {loading ? (
              <p className="customer-home-empty">
                Loading...
              </p>
            ) : attentionItems.length === 0 ? (
              <p className="customer-home-empty">
                Everything is up to date.
              </p>
            ) : (
              <>
                <div className="customer-home-attention-list">
                  {attentionItems
                    .slice(0, 2)
                    .map((item, index) => (
                      <div
                        className="customer-home-attention-row"
                        key={`${item.vehicleText}-${item.service}-${index}`}
                      >
                        <span>
                          {item.vehicleText}
                        </span>

                        <span className="customer-home-due">
                          {item.overdue
                            ? `${item.service} overdue`
                            : `${item.service} due ${formatDate(
                              item.date
                            )}`}
                        </span>
                      </div>
                    ))}
                </div>

                {attentionItems.length > 2 && (
                  <p className="customer-home-more">
                    + {attentionItems.length - 2} more
                  </p>
                )}
              </>
            )}
          </div>


          {/* New Notifications */}

          <div
            className="customer-home-overview-card"
            onClick={() =>
              navigate("/customer/notifications")
            }
          >
            <p className="customer-home-overview-label">
              NEW NOTIFICATIONS
            </p>

            {loading ? (
              <p className="customer-home-empty">
                Loading...
              </p>
            ) : unreadCount === 0 ? (
              <>
                <div className="customer-home-number">
                  0
                </div>

                <p className="customer-home-small-text">
                  No new notifications
                </p>
              </>
            ) : (
              <>
                <div className="customer-home-number">
                  {unreadCount}
                </div>

                <p className="customer-home-small-text">
                  {unreadCount === 1
                    ? "New notification"
                    : "Unread notifications"}
                </p>
              </>
            )}
          </div>


          {/* Recent Service */}

          <div
            className="customer-home-overview-card"
            onClick={() =>
              navigate("/customer/history")
            }
          >
            <p className="customer-home-overview-label">
              RECENT SERVICE
            </p>

            {loading ? (
              <p className="customer-home-empty">
                Loading...
              </p>
            ) : !recentService ? (
              <>
                <div className="customer-home-number">
                  0
                </div>

                <p className="customer-home-small-text">
                  No recent services
                </p>
              </>
            ) : (
              <>
                <strong className="customer-home-recent-service">
                  {recentService.serviceTypes}
                </strong>

                <p className="customer-home-small-text">
                  {recentService.vehicleText}
                </p>

                <span className="customer-home-service-date">
                  {formatDate(recentService.date)}
                </span>
              </>
            )}
          </div>
        </div>


        {/* Upcoming Appointments */}

        <div className="customer-home-upcoming-section">

          <div className="customer-home-upcoming-heading">
            <h2>Upcoming Appointments</h2>

            <p>
              Your upcoming vehicle service bookings.
            </p>
          </div>

          <div
            className="customer-home-upcoming-card"
            onClick={() =>
              navigate("/customer/appointments")
            }
          >
            {loading && (
              <p className="customer-home-empty">
                Loading appointments...
              </p>
            )}

            {!loading &&
              !error &&
              upcomingAppointments.length === 0 && (
                <p className="customer-home-empty">
                  You have no upcoming appointments.
                </p>
              )}

            {!loading &&
              !error &&
              upcomingAppointments
                .slice(0, 2)
                .map((appointment) => (
                  <div
                    key={appointment.id}
                    className="customer-home-appointment-row"
                  >

                    <div className="customer-home-appointment-date">
                      <strong>
                        {formatDate(
                          appointment.appointmentDate
                        )}
                      </strong>

                      <span>
                        {formatTime(
                          appointment.appointmentDate
                        )}
                      </span>
                    </div>

                    <div className="customer-home-appointment-details">
                      <strong>
                        {appointment.vehicleText}
                      </strong>

                      <span>
                        {[
                          appointment.serviceType,
                          ...(appointment.additionalServiceTypes ||
                            []),
                        ]
                          .filter(Boolean)
                          .join(", ") ||
                          "Service appointment"}
                      </span>
                    </div>

                    <span
                      className={`badge badge-${appointment.status}`}
                    >
                      {formatStatus(
                        appointment.status
                      )}
                    </span>

                  </div>
                ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default CustomerHomepage;