import { useEffect, useState } from "react";
import { getAllCustomers } from "../firebase/users";
import { getAllVehicles } from "../firebase/vehicles";
import { signUpCustomer } from "../firebase/auth";

// ---------------------------------------------------------------------------
// useAdminCustomers
//
// Owns the customer+vehicle list, the active/inactive/all tab, search
// filtering, and the "Sign Up New Customer" popup for the Admin Customers
// page. The page component reads off this hook and renders — no Firebase
// calls or filtering logic in the component itself.
// ---------------------------------------------------------------------------
export function useAdminCustomers() {
  const [rows, setRows] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusTab, setStatusTab] = useState("active"); // "active" | "inactive" | "all"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Sign-up popup
  const [showSignUp, setShowSignUp] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [signUpError, setSignUpError] = useState("");
  const [signUpLoading, setSignUpLoading] = useState(false);

  async function loadData() {
    try {
      const [customerList, vehicleList] = await Promise.all([
        getAllCustomers(),
        getAllVehicles(),
      ]);

      // Build one row per vehicle. Customers with no vehicles get a single
      // row with blank vehicle columns, since accounts without a vehicle
      // are still possible for now.
      const builtRows = [];
      customerList.forEach((customer) => {
        const customerVehicles = vehicleList.filter((v) => v.ownerId === customer.id);

        if (customerVehicles.length === 0) {
          builtRows.push({ customer, vehicle: null });
        } else {
          customerVehicles.forEach((vehicle) => {
            builtRows.push({ customer, vehicle });
          });
        }
      });

      setRows(builtRows);
    } catch {
      setError("Failed to load customers.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
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
      await loadData(); // refresh the customer list so the new account appears
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