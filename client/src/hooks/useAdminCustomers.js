import { useEffect, useState } from "react";
import { getAllCustomers } from "../firebase/users";
import { getAllVehicles } from "../firebase/vehicles";
import { signUpCustomer } from "../firebase/auth";

const CACHE_TTL_MS = 30_000;
let cache = null; // { rows, fetchedAt }

export function invalidateAdminCustomersCache() {
  cache = null;
}

function isCacheFresh() {
  return cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS;
}

function buildRows(customerList, vehicleList) {
  // O(customers + vehicles) instead of the previous O(customers × vehicles)
  // nested filter — group vehicles by ownerId once, up front, then look
  // each customer's vehicles up in O(1) instead of re-scanning the full
  // vehicle list per customer.
  const vehiclesByOwner = new Map();
  for (const vehicle of vehicleList) {
    const list = vehiclesByOwner.get(vehicle.ownerId);
    if (list) {
      list.push(vehicle);
    } else {
      vehiclesByOwner.set(vehicle.ownerId, [vehicle]);
    }
  }

  const rows = [];
  for (const customer of customerList) {
    const customerVehicles = vehiclesByOwner.get(customer.id);

    if (!customerVehicles || customerVehicles.length === 0) {
      rows.push({ customer, vehicle: null });
    } else {
      for (const vehicle of customerVehicles) {
        rows.push({ customer, vehicle });
      }
    }
  }

  return rows;
}

// ---------------------------------------------------------------------------
// useAdminCustomers
//
// Owns the customer+vehicle list, the active/inactive/all tab, search
// filtering, and the "Sign Up New Customer" popup for the Admin Customers
// page. The page component reads off this hook and renders — no Firebase
// calls or filtering logic in the component itself.
// ---------------------------------------------------------------------------
export function useAdminCustomers() {
  const [rows, setRows] = useState(() => (isCacheFresh() ? cache.rows : []));
  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState("active"); // "active" | "inactive" | "all"
  // If we already have fresh cached rows, skip the loading state entirely —
  // the page can render immediately instead of flashing "Loading..." for
  // data it's about to show unchanged a moment later.
  const [loading, setLoading] = useState(!isCacheFresh());
  const [error, setError] = useState("");

  // Sign-up popup
  const [showSignUp, setShowSignUp] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [signUpError, setSignUpError] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);

  async function loadData({ force = false } = {}) {
    if (!force && isCacheFresh()) {
      setRows(cache.rows);
      setLoading(false);
      return;
    }

    try {
      const [customerList, vehicleList] = await Promise.all([
        getAllCustomers(),
        getAllVehicles(),
      ]);

      const builtRows = buildRows(customerList, vehicleList);

      cache = { rows: builtRows, fetchedAt: Date.now() };
      setRows(builtRows);
    } catch {
      setError("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openSignUpPopup() {
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setSignUpError("");
    setShowSignUp(true);
  }

  function closeSignUpPopup() {
    setShowSignUp(false);
  }

  async function handleSignUp(e) {
    e.preventDefault();
    setSignUpError("");

    // Validation: non-empty names, email must contain "@", phone digits only
    if (!firstName.trim() || !lastName.trim()) {
      setSignUpError("First and last name are required.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setSignUpError("A valid email is required.");
      return;
    }
    if (!phone.trim() || !/^\d+$/.test(phone)) {
      setSignUpError("Phone must contain digits only.");
      return;
    }

    setSignUpLoading(true);
    try {
      await signUpCustomer({ firstName, lastName, email, phone });
      setShowSignUp(false);
      setLoading(true);
      // force: true — a brand-new customer must never be masked by a
      // still-fresh cache from before they existed.
      await loadData({ force: true });
    } catch (err) {
      setSignUpError(err.message);
    } finally {
      setSignUpLoading(false);
    }
  }

  const term = searchTerm.toLowerCase();

  // Step 1: filter by active status tab.
  // Missing "active" field defaults to true (active), matching the
  // same default used in auth.js and AdminCustomerProfilePage.jsx
  const statusFilteredRows = rows.filter(({ customer }) => {
    const isActive = customer.active !== false;
    if (statusTab === "active") return isActive;
    if (statusTab === "inactive") return !isActive;
    return true; // "all"
  });

  // Step 2: apply the search term on top of the status-filtered rows
  const filteredRows = !term
    ? statusFilteredRows
    : (() => {
        // Customers whose name/phone/email matches the term: show ALL their rows
        const matchingCustomerIds = new Set(
          statusFilteredRows
            .filter(({ customer }) =>
              customer.firstName?.toLowerCase().includes(term) ||
              customer.lastName?.toLowerCase().includes(term) ||
              customer.email?.toLowerCase().includes(term) ||
              customer.phone?.toLowerCase().includes(term)
            )
            .map(({ customer }) => customer.id)
        );

        // A row qualifies if its customer matched on name/phone/email,
        // OR if its specific vehicle's rego matches (rego matches don't pull in siblings)
        return statusFilteredRows.filter(({ customer, vehicle }) => {
          const matchesCustomer = matchingCustomerIds.has(customer.id);
          const matchesRego = vehicle?.rego?.toLowerCase().includes(term);
          return matchesCustomer || matchesRego;
        });
      })();

  return {
    loading,
    error,
    filteredRows,
    statusTab,
    setStatusTab,
    searchTerm,
    setSearchTerm,
    // Exposed so the page can offer a manual "Refresh" action if it wants
    // one — bypasses the cache entirely.
    refresh: () => loadData({ force: true }),
    signUpPopup: {
      show: showSignUp,
      firstName,
      lastName,
      email,
      phone,
      error: signUpError,
      loading: signUpLoading,
      setFirstName,
      setLastName,
      setEmail,
      setPhone,
      open: openSignUpPopup,
      close: closeSignUpPopup,
      onSubmit: handleSignUp,
    },
  };
}