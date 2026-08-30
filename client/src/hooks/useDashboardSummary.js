import { useCallback, useEffect, useState } from "react";
import { getAllCustomers } from "../firebase/users";
import { getAllVehicles } from "../firebase/vehicles";

const DUE_SOON_WINDOW_DAYS = 30;

const CACHE_TTL_MS = 30_000;
let cache = null; // { customers, vehicles, fetchedAt }

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

export function useDashboardSummary() {
  const [customers, setCustomers] = useState(() => (isCacheFresh() ? cache.customers : []));
  const [vehicles, setVehicles] = useState(() => (isCacheFresh() ? cache.vehicles : []));
  const [loading, setLoading] = useState(!isCacheFresh());
  const [error, setError] = useState("");

  const load = useCallback(async ({ force = false } = {}) => {
    if (!force && isCacheFresh()) {
      setCustomers(cache.customers);
      setVehicles(cache.vehicles);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [customerList, vehicleList] = await Promise.all([
        getAllCustomers(),
        getAllVehicles(),
      ]);

      cache = { customers: customerList, vehicles: vehicleList, fetchedAt: Date.now() };
      setCustomers(customerList);
      setVehicles(vehicleList);
    } catch {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(() => load({ force: true }), [load]);

  useEffect(() => {
    load();
  }, [load]);

  const activeCustomers = customers.filter((c) => c.active !== false).length;

  const vehiclesWithService = vehicles
    .map((v) => ({ ...v, daysOut: daysUntil(v.nextServiceDate) }))
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
    upcoming,
    ownerName,
    refresh,
  };
}