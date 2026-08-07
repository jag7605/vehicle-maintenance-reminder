import { useState, useEffect } from "react";
import { getAllCustomers } from "../../firebase/users";
import { getVehiclesByOwner } from "../../firebase/vehicles";
import { getAvailability, createAppointmentAsAdmin } from "../../firebase/appointments";
import "./AdminCreateBookingModal.css";

const SERVICE_TYPES = [
  "WOF",
  "Oil Change",
  "General Service",
  "Brake Check",
  "Tyre Check",
  "Other",
];

const MAX_ADDITIONAL_SERVICES = 2; // 3 total including primary

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
  const [additionalServiceTypes, setAdditionalServiceTypes] = useState([]);
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

  const selectedServiceTypes = [serviceType, ...additionalServiceTypes];

  function handleAddAdditionalService() {
    setAdditionalServiceTypes([...additionalServiceTypes, ""]);
  }

  function handleAdditionalServiceChange(index, value) {
    const updated = [...additionalServiceTypes];
    updated[index] = value;
    setAdditionalServiceTypes(updated);
  }

  function handleRemoveAdditionalService(index) {
    const updated = additionalServiceTypes.filter((_, i) => i !== index);
    setAdditionalServiceTypes(updated);
  }

  function availableOptionsFor(currentValue) {
    return SERVICE_TYPES.filter(
      (type) => type === currentValue || !selectedServiceTypes.includes(type)
    );
  }

  const canAddMore =
    serviceType !== "" && additionalServiceTypes.length < MAX_ADDITIONAL_SERVICES;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!selectedCustomerId || !selectedVehicleId || !selectedSlot || !serviceType) {
      setError("Customer, vehicle, time slot, and service type are all required.");
      return;
    }

    const allSelectedTypes = [serviceType, ...additionalServiceTypes];
    if (allSelectedTypes.includes("Other") && notes.trim() === "") {
      setError(
        "You've selected \"Other\" as a service type. Please describe what you'd like done in the notes field before booking."
      );
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
        notes,
        additionalServiceTypes
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
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>New Booking</h3>
        <p className="modal-subtext">
          Bookings created here are confirmed immediately — no customer approval step.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
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

          <div className="form-field">
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

          <div className="form-field">
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
            <p className="error-text">The garage is closed on this day.</p>
          )}

          {availability && !availability.closed && (
            <div className="form-field">
              <label>Time slot</label><br />
              <div className="slot-row">
                {availability.slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    onClick={() => setSelectedSlot(slot.time)}
                    disabled={!slot.available}
                    className={
                      "slot-btn" +
                      (selectedSlot === slot.time ? " slot-btn-selected" : "") +
                      (!slot.available ? " slot-btn-unavailable" : "")
                    }
                  >
                    {slot.time} {!slot.available ? "(Booked)" : ""}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="form-field">
            <label>Service type</label><br />
            <select
              value={serviceType}
              onChange={(e) => {
                const newValue = e.target.value;
                setServiceType(newValue);
                if (newValue === "") {
                  setAdditionalServiceTypes([]);
                }
              }}
              required
            >
              <option value="" disabled>Select a service type</option>
              {availableOptionsFor(serviceType).map((type) => (
                <option key={type} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {additionalServiceTypes.map((additionalType, index) => (
            <div className="form-field" key={index}>
              <label>Additional service type</label><br />
              <select
                value={additionalType}
                onChange={(e) => handleAdditionalServiceChange(index, e.target.value)}
              >
                <option value="">Choose a service type</option>
                {availableOptionsFor(additionalType).map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => handleRemoveAdditionalService(index)}
                className="remove-service-btn"
              >
                Remove service
              </button>
            </div>
          ))}

          <div className="form-field">
            <button
              type="button"
              onClick={handleAddAdditionalService}
              disabled={!canAddMore}
            >
              Add additional service +
            </button>
          </div>

          <div className="form-field">
            <label>Notes</label><br />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any additional information here..."
            />
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="modal-actions">
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