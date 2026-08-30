import { useState, useEffect, useCallback } from "react";
import {
  getAllAppointments,
  updateAppointmentStatus,
} from "../firebase/appointments";
import { getAllCustomers } from "../firebase/users";
import { getAllVehicles } from "../firebase/vehicles";

const CACHE_TTL_MS = 30_000;
let cache = null; // { appointments, fetchedAt }

export function invalidateAdminBookingsCache() {
  cache = null;
}

function isCacheFresh() {
  return cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
}

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
  const [appointments, setAppointments] = useState(() => (isCacheFresh() ? cache.appointments : []));
  const [loading, setLoading] = useState(!isCacheFresh());
  const [error, setError] = useState("");
 
  // Per-appointment action state, keyed by appointmentId — mirrors the
  // reminderLoading/reminderResult pattern in AdminCustomerProfilePage.
  const [actionLoading, setActionLoading] = useState({});
  const [actionError, setActionError] = useState({});
 
  const load = useCallback(async ({ force = false } = {}) => {
    if (!force && isCacheFresh()) {
      setAppointments(cache.appointments);
      setLoading(false);
      return;
    }

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
      cache = { appointments: enriched, fetchedAt: Date.now() };
      setAppointments(enriched);
    } catch {
      setError("Failed to load bookings.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Exposed to callers (e.g. after creating a booking) — always bypasses
  // the cache, since the whole point is to see the just-created booking.
  const refresh = useCallback(() => load({ force: true }), [load]);
 
  useEffect(() => {
    load();
  }, [load]);
 
  // status: "confirmed" | "rejected" | "completed"
  // Always routes through the PATCH endpoint
  // write — since the endpoint is what triggers the customer notification.
  async function changeStatus(appointmentId, status) {
    setActionLoading((prev) => ({ ...prev, [appointmentId]: true }));
    setActionError((prev) => ({ ...prev, [appointmentId]: "" }));
 
    try {
      await updateAppointmentStatus(appointmentId, status);

      const updated = appointments.map((a) =>
        a.id === appointmentId ? { ...a, status } : a
      );
      setAppointments(updated);

      // Write-through — keep the cache in sync with the change we just
      // made, rather than leaving it stale until the TTL expires.
      if (cache) {
        cache = { appointments: updated, fetchedAt: cache.fetchedAt };
      }
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