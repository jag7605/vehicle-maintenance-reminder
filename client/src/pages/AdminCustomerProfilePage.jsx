import { useState, useEffect, Fragment } from "react";
import { useParams } from "react-router-dom";
import { addVehicle, getVehiclesByOwner, updateVehicle, deleteVehicle } from "../firebase/vehicles";
import { getCustomerById, setCustomerActiveStatus } from "../firebase/users";
import { getNotificationsByVehicle } from "../firebase/notifications";
import { vehicleMakesModels } from "../data/vehicleMakesModels";
import StaffLayout from "../component/StaffLayout";


const API_URL = import.meta.env.VITE_API_URL;

// ---------------------------------------------------------------------------
// Helper — render a deliveryStatus map as human-readable channel results.
// Keys present = channel was attempted. Key absent = channel was disabled.
// ---------------------------------------------------------------------------
function DeliveryStatusBadges({ deliveryStatus }) {
  if (!deliveryStatus || Object.keys(deliveryStatus).length === 0) {
    return <span>No delivery data</span>;
  }

  const channelLabels = { email: "Email", browser: "Browser", sms: "SMS" };
  const allChannels = ["email", "browser", "sms"];

  return (
    <span>
      {allChannels.map((channel) => {
        if (!(channel in deliveryStatus)) {
          // Channel was disabled — show muted label
          return (
            <span key={channel} style={{ marginRight: "8px", color: "#999" }}>
              {channelLabels[channel]}: disabled
            </span>
          );
        }
        const status = deliveryStatus[channel];
        return (
          <span
            key={channel}
            style={{
              marginRight: "8px",
              color: status === "sent" ? "green" : "red",
            }}
          >
            {channelLabels[channel]}: {status}
          </span>
        );
      })}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Helper — format a Firestore Timestamp or JS Date for display
// ---------------------------------------------------------------------------
function formatDate(value) {
  if (!value) return "—";
  // Firestore Timestamps have a .toDate() method
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return date.toLocaleDateString("en-NZ", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// ---------------------------------------------------------------------------
// Helper — convert a Firestore Timestamp to the yyyy-MM-dd string that
// <input type="date"> expects, or return "" if unset
// ---------------------------------------------------------------------------
function timestampToDateInput(value) {
  if (!value) return "";
  const date = typeof value.toDate === "function" ? value.toDate() : new Date(value);
  return date.toISOString().split("T")[0];
}

// ---------------------------------------------------------------------------
// Sub-component — per-vehicle notification history panel
// ---------------------------------------------------------------------------
function VehicleNotificationHistory({ vehicleId }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await getNotificationsByVehicle(vehicleId);
        setNotifications(data);
      } catch {
        setError("Failed to load notification history.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [vehicleId]);

  if (loading) return <p style={{ margin: "4px 0" }}>Loading history...</p>;
  if (error) return <p style={{ color: "red", margin: "4px 0" }}>{error}</p>;
  if (notifications.length === 0) return <p style={{ margin: "4px 0" }}>No reminders sent yet.</p>;

  return (
    <table border="1" cellPadding="4" style={{ marginTop: "6px", fontSize: "0.9em" }}>
      <thead>
        <tr>
          <th>Sent</th>
          <th>Message</th>
          <th>Delivery</th>
        </tr>
      </thead>
      <tbody>
        {notifications.map((n) => (
          <tr key={n.id}>
            <td style={{ whiteSpace: "nowrap" }}>{formatDate(n.sentAt)}</td>
            <td>{n.message}</td>
            <td>
              <DeliveryStatusBadges deliveryStatus={n.deliveryStatus} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------
function AdminCustomerProfilePage() {
  const { customerId } = useParams();

  const [customer, setCustomer] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [rego, setRego] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Edit popup state
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editYear, setEditYear] = useState("");
  const [editMileage, setEditMileage] = useState("");
  const [editRego, setEditRego] = useState("");
  const [editNextServiceDate, setEditNextServiceDate] = useState("");    // yyyy-MM-dd string
  const [editNextServiceMileage, setEditNextServiceMileage] = useState(""); // number string or ""
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete popup state
  const [deletingVehicle, setDeletingVehicle] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Activate/Deactivate popup state
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");

  // Send Reminder state — keyed by vehicleId so buttons are independent
  const [reminderLoading, setReminderLoading] = useState({}); // { [vehicleId]: bool }
  const [reminderResult, setReminderResult] = useState({});   // { [vehicleId]: { success, deliveryStatus, error } }

  // Notification history panel — which vehicleId is expanded
  const [expandedHistory, setExpandedHistory] = useState({}); // { [vehicleId]: bool }

  async function refreshVehicles() {
    const updatedVehicles = await getVehiclesByOwner(customerId);
    setVehicles(updatedVehicles);
  }

  useEffect(() => {
    async function loadCustomerData() {
      try {
        const [customerData, vehicleData] = await Promise.all([
          getCustomerById(customerId),
          getVehiclesByOwner(customerId),
        ]);
        setCustomer(customerData);
        setVehicles(vehicleData);
      } catch {
        setPageError("Failed to load customer details.");
      } finally {
        setPageLoading(false);
      }
    }

    loadCustomerData();
  }, [customerId]);

  function handleMakeChange(e) {
    setMake(e.target.value);
    setModel("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      await addVehicle({
        make,
        model,
        year: Number(year),
        mileage: Number(mileage),
        rego,
        ownerId: customerId,
      });

      setSuccess("Vehicle added successfully.");
      setMake("");
      setModel("");
      setYear("");
      setMileage("");
      setRego("");

      await refreshVehicles();
    } catch {
      setError("Something went wrong while adding the vehicle.");
    } finally {
      setLoading(false);
    }
  }

  function openEditPopup(vehicle) {
    setEditingVehicle(vehicle);
    setEditYear(vehicle.year);
    setEditMileage(vehicle.mileage);
    setEditRego(vehicle.rego);
    setEditNextServiceDate(timestampToDateInput(vehicle.nextServiceDate));
    setEditNextServiceMileage(vehicle.nextServiceMileage != null ? String(vehicle.nextServiceMileage) : "");
    setEditError("");
  }

  function closeEditPopup() {
    setEditingVehicle(null);
  }

  async function handleEditSave(e) {
    e.preventDefault();
    setEditError("");
    setEditLoading(true);

    try {
      // Convert the yyyy-MM-dd string to a JS Date so updateVehicle()
      // can turn it into a Firestore Timestamp. Pass null if cleared.
      const nextServiceDate = editNextServiceDate
        ? new Date(editNextServiceDate)
        : null;

      // Convert mileage string → number, or null if cleared
      const nextServiceMileage = editNextServiceMileage !== ""
        ? Number(editNextServiceMileage)
        : null;

      await updateVehicle(editingVehicle.id, {
        year: Number(editYear),
        mileage: Number(editMileage),
        rego: editRego,
        nextServiceDate,
        nextServiceMileage,
      });

      await refreshVehicles();
      setEditingVehicle(null);
    } catch {
      setEditError("Something went wrong while saving changes.");
    } finally {
      setEditLoading(false);
    }
  }

  function openDeletePopup(vehicle) {
    setDeletingVehicle(vehicle);
    setDeleteError("");
  }

  function closeDeletePopup() {
    setDeletingVehicle(null);
  }

  async function handleDeleteConfirm() {
    setDeleteError("");
    setDeleteLoading(true);

    try {
      await deleteVehicle(deletingVehicle.id);
      await refreshVehicles();
      setDeletingVehicle(null);
    } catch {
      setDeleteError("Something went wrong while deleting the vehicle.");
    } finally {
      setDeleteLoading(false);
    }
  }

  function openStatusConfirm() {
    setStatusError("");
    setShowStatusConfirm(true);
  }

  function closeStatusConfirm() {
    setShowStatusConfirm(false);
  }

  async function handleToggleActive() {
    const isCurrentlyActive = customer.active !== false;
    const nextStatus = !isCurrentlyActive;

    setStatusError("");
    setStatusLoading(true);

    try {
      await setCustomerActiveStatus(customerId, nextStatus);
      setCustomer({ ...customer, active: nextStatus });
      setShowStatusConfirm(false);
    } catch {
      setStatusError("Something went wrong while updating status.");
    } finally {
      setStatusLoading(false);
    }
  }

  // -------------------------------------------------------------------------
  // Send Reminder — calls POST /api/admin/send-reminder/:vehicleId
  // -------------------------------------------------------------------------
  async function handleSendReminder(vehicleId) {
    setReminderLoading((prev) => ({ ...prev, [vehicleId]: true }));
    setReminderResult((prev) => ({ ...prev, [vehicleId]: null }));

    try {
      const res = await fetch(`${API_URL}/api/admin/send-reminder/${vehicleId}`, {
        method: "POST",
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setReminderResult((prev) => ({
          ...prev,
          [vehicleId]: { success: true, deliveryStatus: data.deliveryStatus },
        }));
      } else {
        // 400 (no service date) or 404 (vehicle/customer not found)
        setReminderResult((prev) => ({
          ...prev,
          [vehicleId]: { success: false, error: data.error || "Unknown error." },
        }));
      }
    } catch {
      setReminderResult((prev) => ({
        ...prev,
        [vehicleId]: { success: false, error: "Could not reach the server." },
      }));
    } finally {
      setReminderLoading((prev) => ({ ...prev, [vehicleId]: false }));
    }
  }

  function toggleHistory(vehicleId) {
    setExpandedHistory((prev) => ({ ...prev, [vehicleId]: !prev[vehicleId] }));
  }

  const availableModels = make ? vehicleMakesModels[make] : [];

  if (pageLoading) return <p>Loading customer...</p>;
  if (pageError) return <p style={{ color: "red" }}>{pageError}</p>;

  const isActive = customer.active !== false;

  return (
    <StaffLayout title="Customers">
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <h2>{customer.firstName} {customer.lastName}</h2>
        <span style={{ color: isActive ? "green" : "red" }}>
          {isActive ? "Active" : "Inactive"}
        </span>
        <button onClick={openStatusConfirm} disabled={statusLoading}>
          {statusLoading ? "Updating..." : isActive ? "Deactivate" : "Activate"}
        </button>
      </div>

      <p>Email: {customer.email}</p>
      <p>Phone: {customer.phone}</p>

      <h3>Vehicles</h3>
      {vehicles.length === 0 ? (
        <p>No vehicles on file.</p>
      ) : (
        <table border="1" cellPadding="6">
          <thead>
            <tr>
              <th>Year</th>
              <th>Make</th>
              <th>Model</th>
              <th>Rego</th>
              <th>Mileage</th>
              <th>Next Service Date</th>
              <th>Next Service Mileage</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => {
              const result = reminderResult[vehicle.id];
              const isLoadingReminder = reminderLoading[vehicle.id];
              const historyOpen = expandedHistory[vehicle.id];

              return (
                <Fragment key={vehicle.id}>
                  <tr>
                    <td>{vehicle.year}</td>
                    <td>{vehicle.make}</td>
                    <td>{vehicle.model}</td>
                    <td>{vehicle.rego}</td>
                    <td>{vehicle.mileage}</td>
                    <td>{formatDate(vehicle.nextServiceDate)}</td>
                    <td>{vehicle.nextServiceMileage != null ? `${vehicle.nextServiceMileage.toLocaleString()} km` : "—"}</td>
                    <td>
                      <button onClick={() => openEditPopup(vehicle)}>Edit</button>{" "}
                      <button onClick={() => openDeletePopup(vehicle)}>Delete</button>{" "}
                      <button
                        onClick={() => handleSendReminder(vehicle.id)}
                        disabled={isLoadingReminder}
                      >
                        {isLoadingReminder ? "Sending..." : "Send Reminder"}
                      </button>{" "}
                      <button onClick={() => toggleHistory(vehicle.id)}>
                        {historyOpen ? "Hide History" : "Show History"}
                      </button>
                    </td>
                  </tr>

                  {/* Reminder result row — shown immediately after clicking Send Reminder */}
                  {result && (
                    <tr>
                      <td colSpan="8">
                        {result.success ? (
                          <span>
                            <strong>Reminder sent.</strong>{" "}
                            <DeliveryStatusBadges deliveryStatus={result.deliveryStatus} />
                          </span>
                        ) : (
                          <span style={{ color: "red" }}>
                            <strong>Failed:</strong> {result.error}
                          </span>
                        )}
                      </td>
                    </tr>
                  )}

                  {/* Notification history panel */}
                  {historyOpen && (
                    <tr>
                      <td colSpan="8">
                        <strong>Notification History</strong>
                        <VehicleNotificationHistory vehicleId={vehicle.id} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Edit Vehicle Popup                                                  */}
      {/* ------------------------------------------------------------------ */}
      {editingVehicle && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ backgroundColor: "white", padding: "20px", minWidth: "300px" }}>
            <h3>Edit Vehicle: {editingVehicle.make} {editingVehicle.model}</h3>
            <form onSubmit={handleEditSave}>
              <div>
                <label>Year</label><br />
                <input
                  type="number"
                  value={editYear}
                  onChange={(e) => setEditYear(e.target.value)}
                  required
                />
              </div>

              <div>
                <label>Mileage</label><br />
                <input
                  type="number"
                  value={editMileage}
                  onChange={(e) => setEditMileage(e.target.value)}
                  required
                />
              </div>

              <div>
                <label>Rego</label><br />
                <input
                  value={editRego}
                  onChange={(e) => setEditRego(e.target.value)}
                  required
                />
              </div>

              <div>
                <label>Next Service Date</label><br />
                <input
                  type="date"
                  value={editNextServiceDate}
                  onChange={(e) => setEditNextServiceDate(e.target.value)}
                />
                <br />
                <small>Leave blank to clear the service date.</small>
              </div>

              <div>
                <label>Next Service Mileage (km)</label><br />
                <input
                  type="number"
                  min="0"
                  value={editNextServiceMileage}
                  onChange={(e) => setEditNextServiceMileage(e.target.value)}
                  placeholder="e.g. 150000"
                />
                <br />
                <small>Leave blank to clear the mileage target.</small>
              </div>

              {editError && <p style={{ color: "red" }}>{editError}</p>}

              <button type="submit" disabled={editLoading}>
                {editLoading ? "Saving..." : "Save"}
              </button>{" "}
              <button type="button" onClick={closeEditPopup}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Delete Vehicle Popup                                                */}
      {/* ------------------------------------------------------------------ */}
      {deletingVehicle && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ backgroundColor: "white", padding: "20px", minWidth: "300px" }}>
            <h3>Delete Vehicle: {deletingVehicle.make} {deletingVehicle.model}</h3>
            <p>Year: {deletingVehicle.year}</p>
            <p>Rego: {deletingVehicle.rego}</p>
            <p>Mileage: {deletingVehicle.mileage}</p>
            <p>Are you sure you want to delete this vehicle?</p>

            {deleteError && <p style={{ color: "red" }}>{deleteError}</p>}

            <button onClick={handleDeleteConfirm} disabled={deleteLoading}>
              {deleteLoading ? "Deleting..." : "Delete"}
            </button>{" "}
            <button type="button" onClick={closeDeletePopup}>Cancel</button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Activate / Deactivate Popup                                         */}
      {/* ------------------------------------------------------------------ */}
      {showStatusConfirm && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <div style={{ backgroundColor: "white", padding: "20px", minWidth: "300px" }}>
            <h3>{isActive ? "Deactivate" : "Activate"} {customer.firstName} {customer.lastName}</h3>
            {isActive && <p>They will not be able to log in until reactivated.</p>}

            {statusError && <p style={{ color: "red" }}>{statusError}</p>}

            <button onClick={handleToggleActive} disabled={statusLoading}>
              {statusLoading ? "Updating..." : isActive ? "Deactivate" : "Activate"}
            </button>{" "}
            <button type="button" onClick={closeStatusConfirm}>Cancel</button>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Add Vehicle Form                                                     */}
      {/* ------------------------------------------------------------------ */}
      <h2>Add Vehicle for {customer.firstName} {customer.lastName}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Make</label><br />
          <select value={make} onChange={handleMakeChange} required>
            <option value="" disabled>Select a make</option>
            {Object.keys(vehicleMakesModels).map((makeOption) => (
              <option key={makeOption} value={makeOption}>{makeOption}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Model</label><br />
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            disabled={!make}
            required
          >
            <option value="" disabled>Select a model</option>
            {availableModels.map((modelOption) => (
              <option key={modelOption} value={modelOption}>{modelOption}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Year</label><br />
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)} required />
        </div>

        <div>
          <label>Mileage</label><br />
          <input type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} required />
        </div>

        <div>
          <label>Rego</label><br />
          <input value={rego} onChange={(e) => setRego(e.target.value.toUpperCase())} required />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add Vehicle"}
        </button>
      </form>
    </div>
    </StaffLayout>
  );
}

export default AdminCustomerProfilePage;