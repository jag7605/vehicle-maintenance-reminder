import { useState, useEffect, useCallback } from "react";
import { getAllAppointments, completeAppointment } from "../firebase/appointments";
import { getAllCustomers } from "../firebase/users";
import { getAllVehicles } from "../firebase/vehicles";

function enrichAppointments(appointments, customerMap, vehicleMap) {
  return appointments.map((appt) => {
    const customer = customerMap.get(appt.customerId);
    const vehicle = vehicleMap.get(appt.vehicleId);

    return {
      ...appt,
      customerName: customer
        ? `${customer.firstName} ${customer.lastName}`
        : "Unknown customer",
      customerPhone: customer?.phone || "",
      vehicleLabel: vehicle
        ? `${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.rego})`
        : "Unknown vehicle",
    };
  });
}

// "Today's jobs" = appointments where status == "confirmed" AND date falls
// within today's calendar day (Sprint 5 decision #4). Pending, cancelled,
// rejected, and already-completed appointments are excluded.
function isToday(dateValue) {
  const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

// "Mark as complete" is enabled only once the current
// time has passed the appointment's booked start time (start of the slot,
// not end).
function hasStartTimePassed(dateValue) {
  const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
  return date <= new Date();
}

export function useAdminJobs() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Per-job action state, keyed by appointmentId — mirrors the pattern used
  // in useAdminBookings / AdminCustomerProfilePage.
  const [actionLoading, setActionLoading] = useState({});
  const [actionError, setActionError] = useState({});

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [appointmentData, customerData, vehicleData] = await Promise.all([
        getAllAppointments(),
        getAllCustomers(),
        getAllVehicles(),
      ]);

      const customerMap = new Map(customerData.map((c) => [c.id, c]));
      const vehicleMap = new Map(vehicleData.map((v) => [v.id, v]));

      const enriched = enrichAppointments(appointmentData, customerMap, vehicleMap);

      const todaysConfirmedJobs = enriched
        .filter((appt) => appt.status === "confirmed" && isToday(appt.date))
        .map((appt) => ({
          ...appt,
          canComplete: hasStartTimePassed(appt.date),
        }));

      setJobs(todaysConfirmedJobs);
    } catch {
      setError("Failed to load today's jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Marks a job complete via the dedicated completion endpoint, passing
  // along the admin-entered postServiceNotes. Always routes through the
  // backend — never a direct Firestore write — since the backend performs
  // the server-side time-gate check.
  async function markJobComplete(appointmentId, postServiceNotes) {
    setActionLoading((prev) => ({ ...prev, [appointmentId]: true }));
    setActionError((prev) => ({ ...prev, [appointmentId]: "" }));

    try {
      const result = await completeAppointment(appointmentId, postServiceNotes);

      // Completed jobs drop off the "today's confirmed jobs" list entirely,
      // matching the same "filter it off" pattern used for rejected bookings
      // on the calendar.
      setJobs((prev) => prev.filter((job) => job.id !== appointmentId));

      return result; // { success, appointment, deliveryStatus }
    } catch (err) {
      setActionError((prev) => ({ ...prev, [appointmentId]: err.message }));
      return false;
    } finally {
      setActionLoading((prev) => ({ ...prev, [appointmentId]: false }));
    }
  }

  return {
    jobs,
    loading,
    error,
    actionLoading,
    actionError,
    markJobComplete,
    refresh,
  };
}