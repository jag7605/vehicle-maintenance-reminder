import { useState, useEffect } from "react";
import { getAllCustomers } from "../../firebase/users";
import { getVehiclesByOwner } from "../../firebase/vehicles";
import { getAvailability, createAppointmentAsAdmin } from "../../firebase/appointments";

const SERVICE_TYPES = [
  "WOF",
  "Oil Change",
  "General Service",
  "Brake Check",
  "Tyre Check",
  "Other",
];

function formatDateForApi(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function AdminCreateBookingModal({ onClose, onCreated }) {
  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(true);

  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [vehicles, setVehicles] = useState([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState("");

  const [dateString, setDateString] = useState("");
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState("");

  const [serviceType, setServiceType] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await getAllCustomers();
        setCustomers(data);
      } catch {
        setError("Failed to load customers.");
      } finally {
        setCustomersLoading(false);
      }
    }
    loadCustomers();
  }, []);

  async function handleCustomerChange(customerId) {
    setSelectedCustomerId(customerId);
    setSelectedVehicleId("");
    setVehicles([]);

    if (!customerId) return;

    setVehiclesLoading(true);
    try {
      const data = await getVehiclesByOwner(customerId);
      setVehicles(data);
    } catch {
      setError("Failed to load this customer's vehicles.");
    } finally {
      setVehiclesLoading(false);
    }
  }

  async function handleDateChange(value) {
    setDateString(value);
    setSelectedSlot("");
    setAvailability(null);

    if (!value) return;

    setAvailabilityLoading(true);
    setError("");
    try {
      const data = await getAvailability(value);
      setAvailability(data);
    } catch {
      setError("Failed to load availability for that date.");
    } finally {
      setAvailabilityLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!selectedCustomerId || !selectedVehicleId || !selectedSlot || !serviceType) {
      setError("Customer, vehicle, time slot, and service type are all required.");
      return;
    }

    const [year, month, day] = dateString.split("-").map(Number);
    const [hour, minute] = selectedSlot.split(":").map(Number);
    const appointmentDate = new Date(year, month - 1, day, hour, minute);

    setSubmitting(true);
    try {
      await createAppointmentAsAdmin(
        selectedCustomerId,
        selectedVehicleId,
        appointmentDate,
        serviceType,
        notes
      );
      onCreated();
    } catch (err) {
      setError(err.message || "Failed to create booking.");
    } finally {
      setSubmitting(false);
    }
  }

  const todayString = formatDateForApi(new Date());

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div style={{ backgroundColor: "white", padding: "20px", minWidth: "360px", borderRadius: "6px" }}>
        <h3>New Booking</h3>
        <p style={{ color: "#555", fontSize: "14px", marginTop: "-8px" }}>
          Bookings created here are confirmed immediately — no customer approval step.
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "12px" }}>
            <label>Customer</label><br />
            <select
              value={selectedCustomerId}
              onChange={(e) => handleCustomerChange(e.target.value)}
              disabled={customersLoading}
              required
            >
              <option value="" disabled>
                {customersLoading ? "Loading customers..." : "Select a customer"}
              </option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label>Vehicle</label><br />
            <select
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              disabled={!selectedCustomerId || vehiclesLoading}
              required
            >
              <option value="" disabled>
                {vehiclesLoading
                  ? "Loading vehicles..."
                  : !selectedCustomerId
                  ? "Select a customer first"
                  : vehicles.length === 0
                  ? "This customer has no vehicles"
                  : "Select a vehicle"}
              </option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.year} {v.make} {v.model} ({v.rego})
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label>Date</label><br />
            <input
              type="date"
              value={dateString}
              min={todayString}
              onChange={(e) => handleDateChange(e.target.value)}
              required
            />
          </div>

          {availabilityLoading && <p>Loading available slots...</p>}

          {availability && availability.closed && (
            <p style={{ color: "red" }}>The garage is closed on this day.</p>
          )}

          {availability && !availability.closed && (
            <div style={{ marginBottom: "12px" }}>
              <label>Time slot</label><br />
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                {availability.slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setSelectedSlot(slot.time)}
                    disabled={!slot.available}
                    style={{
                      padding: "6px 10px",
                      border: selectedSlot === slot.time ? "2px solid #2563eb" : "1px solid #ccc",
                      backgroundColor: !slot.available ? "#eee" : "white",
                      borderRadius: "4px",
                    }}
                  >
                    {slot.time} {!slot.available ? "(Booked)" : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div style={{ marginBottom: "12px" }}>
            <label>Service type</label><br />
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              required
            >
              <option value="" disabled>Select a service type</option>
              {SERVICE_TYPES.map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: "12px" }}>
            <label>Notes</label><br />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes"
            />
          </div>

          {error && <p style={{ color: "red" }}>{error}</p>}

          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Booking"}
            </button>
            <button type="button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminCreateBookingModal;