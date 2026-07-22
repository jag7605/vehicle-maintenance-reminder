import { useState, useEffect, useCallback } from "react";
import {
  getAllAppointments,
  updateAppointmentStatus,
} from "../firebase/appointments";
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
 
export function useAdminBookings() {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
 
  // Per-appointment action state, keyed by appointmentId — mirrors the
  // reminderLoading/reminderResult pattern in AdminCustomerProfilePage.
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
 
      setAppointments(enrichAppointments(appointmentData, customerMap, vehicleMap));
    } catch {
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, []);
 
  useEffect(() => {
    refresh();
  }, [refresh]);
 
  // status: "confirmed" | "rejected" | "completed"
  // Always routes through the PATCH endpoint
  // write — since the endpoint is what triggers the customer notification.
  async function changeStatus(appointmentId, status) {
    setActionLoading((prev) => ({ ...prev, [appointmentId]: true }));
    setActionError((prev) => ({ ...prev, [appointmentId]: "" }));
 
    try {
      await updateAppointmentStatus(appointmentId, status);
      setAppointments((prev) =>
        prev.map((a) => (a.id === appointmentId ? { ...a, status } : a))
      );
    } catch (err) {
      setActionError((prev) => ({ ...prev, [appointmentId]: err.message }));
    } finally {
      setActionLoading((prev) => ({ ...prev, [appointmentId]: false }));
    }
  }
 
  return {
    appointments,
    loading,
    error,
    actionLoading,
    actionError,
    changeStatus,
    refresh,
  };
}