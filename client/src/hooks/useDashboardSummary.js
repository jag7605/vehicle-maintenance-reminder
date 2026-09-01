import { useCallback, useEffect, useState } from "react";
import { getAllCustomers } from "../firebase/users";
import { getAllVehicles } from "../firebase/vehicles";
import { getAllAppointments } from "../firebase/appointments";

const DUE_SOON_WINDOW_DAYS = 30;

const CACHE_TTL_MS = 30_000;
let cache = null; // { customers, vehicles, appointments, fetchedAt }

export function invalidateDashboardSummaryCache() {
  cache = null;
}

function isCacheFresh() {
  return cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
}

// ---------------------------------------------------------------------------
// Helper — days between today and a Firestore Timestamp/Date (negative = past)
// ---------------------------------------------------------------------------
function daysUntil(value) {
  if (!value) return null;
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  const msPerDay = 1000 * 60 * 60 * 24;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.round((date - today) / msPerDay);
}

// ---------------------------------------------------------------------------
// Helper — pick whichever of nextWofDate / nextOilChangeDate is soonest due
// (most overdue / closest upcoming), since a vehicle's dashboard status
// should reflect whichever service is more urgent. Returns the days-out
// figure alongside which service it came from, so the UI can label it.
// ---------------------------------------------------------------------------
function nextDueInfo(vehicle) {
  const wofDays = daysUntil(vehicle.nextWofDate);
  const oilDays = daysUntil(vehicle.nextOilChangeDate);

  if (wofDays === null && oilDays === null) return { daysOut: null, serviceType: null };
  if (wofDays === null) return { daysOut: oilDays, serviceType: "Oil Change" };
  if (oilDays === null) return { daysOut: wofDays, serviceType: "WoF" };

  return wofDays <= oilDays
    ? { daysOut: wofDays, serviceType: "WoF" }
    : { daysOut: oilDays, serviceType: "Oil Change" };
}

// ---------------------------------------------------------------------------
// Helper — same "today" definition used by useAdminJobs.js, so the
// dashboard's "Jobs Today" count always matches the Jobs page.
// ---------------------------------------------------------------------------
function isToday(dateValue) {
  const date = dateValue?.toDate ? dateValue.toDate() : new Date(dateValue);
  const now = new Date();

  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

export function useDashboardSummary() {
  const [customers, setCustomers] = useState(() => (isCacheFresh() ? cache.customers : []));
  const [vehicles, setVehicles] = useState(() => (isCacheFresh() ? cache.vehicles : []));
  const [appointments, setAppointments] = useState(() => (isCacheFresh() ? cache.appointments : []));
  const [loading, setLoading] = useState(!isCacheFresh());
  const [error, setError] = useState("");

  const load = useCallback(async ({ force = false } = {}) => {
    if (!force && isCacheFresh()) {
      setCustomers(cache.customers);
      setVehicles(cache.vehicles);
      setAppointments(cache.appointments);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [customerList, vehicleList, appointmentList] = await Promise.all([
        getAllCustomers(),
        getAllVehicles(),
        getAllAppointments(),
      ]);

      cache = {
        customers: customerList,
        vehicles: vehicleList,
        appointments: appointmentList,
        fetchedAt: Date.now(),
      };
      setCustomers(customerList);
      setVehicles(vehicleList);
      setAppointments(appointmentList);
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => load({ force: true }), [load]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const activeCustomers = customers.filter((c) => c.active !== false).length;

  const vehiclesWithService = vehicles
    .map((v) => ({ ...v, ...nextDueInfo(v) }))
    .filter((v) => v.daysOut !== null);

  const overdueCount = vehiclesWithService.filter((v) => v.daysOut < 0).length;
  const dueSoonCount = vehiclesWithService.filter(
    (v) => v.daysOut >= 0 && v.daysOut <= DUE_SOON_WINDOW_DAYS
  ).length;

  // Overdue first (most overdue first), then soonest-due — top 8 for the table
  const upcoming = vehiclesWithService
    .filter((v) => v.daysOut <= DUE_SOON_WINDOW_DAYS)
    .sort((a, b) => a.daysOut - b.daysOut)
    .slice(0, 8);

  const pendingBookingsCount = appointments.filter((a) => a.status === "pending").length;

  const jobsTodayCount = appointments.filter(
    (a) => a.status === "confirmed" && isToday(a.date)
  ).length;

  function ownerName(ownerId) {
    const owner = customers.find((c) => c.id === ownerId);
    return owner ? `${owner.firstName} ${owner.lastName}` : "—";
  }

  return {
    loading,
    error,
    activeCustomers,
    inactiveCustomerCount: customers.length - activeCustomers,
    totalVehicleCount: vehicles.length,
    overdueCount,
    dueSoonCount,
    pendingBookingsCount,
    jobsTodayCount,
    upcoming,
    ownerName,
    refresh,
  };
}