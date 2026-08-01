const SERVICE_TYPES = [
  "WOF",
  "Oil Change",
  "General Service",
  "Brake Check",
  "Tyre Check",
  "Other",
];

const MAX_ADDITIONAL_SERVICES = 2; // 3 total including primary

function formatDisplayDate(date) {
  return date.toLocaleDateString("en-NZ", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function SlotBookingForm({
  selectedDate,
  availability,
  loading,
  selectedSlot,
  setSelectedSlot,
  vehicles,
  selectedVehicleId,
  setSelectedVehicleId,
  serviceType,
  setServiceType,
  additionalServiceTypes,
  setAdditionalServiceTypes,
  notes,
  setNotes,
  bookingLoading,
  onBook,
}) {
  if (loading) return <p>Loading available slots...</p>;
  if (!selectedDate || !availability) return null;

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
    // A dropdown keeps showing its own current selection, but excludes
    // anything already chosen in another dropdown.
    return SERVICE_TYPES.filter(
      (type) => type === currentValue || !selectedServiceTypes.includes(type)
    );
  }

  const canAddMore =
    serviceType !== "" && additionalServiceTypes.length < MAX_ADDITIONAL_SERVICES;

  return (
    <div className="slots-section">
      <h2>Available slots for {formatDisplayDate(selectedDate)}</h2>

      {availability.closed && <p>The garage is closed on this day.</p>}

      {!availability.closed && availability.slots.length === 0 && (
        <p>No slots available for this date.</p>
      )}

      {!availability.closed && availability.slots.length > 0 && (
        <>
          <div className="slot-buttons">
            {availability.slots.map((slot) => (
              <button
                key={slot.time}
                type="button"
                className={
                  selectedSlot === slot.time
                    ? "slot-button selected-slot"
                    : slot.available
                    ? "slot-button"
                    : "slot-button booked"
                }
                disabled={!slot.available}
                onClick={() => setSelectedSlot(slot.time)}
              >
                {slot.time} {slot.available ? "" : "(Booked)"}
              </button>
            ))}
          </div>

          <div className="booking-form">
            <label>
              Select vehicle:
              <select
                value={selectedVehicleId}
                onChange={(event) => setSelectedVehicleId(event.target.value)}
              >
                <option value="">Choose a vehicle</option>
                {vehicles.map((vehicle) => (
                  <option key={vehicle.id} value={vehicle.id}>
                    {vehicle.make} {vehicle.model} -{" "}
                    {vehicle.plate || vehicle.registration || vehicle.rego || vehicle.id}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Service type:
              <select
                value={serviceType}
                onChange={(event) => {
                  const newValue = event.target.value;
                  setServiceType(newValue);
                  // Clearing the primary selection also clears any
                  // additional services, since "add additional" requires
                  // a primary service to be selected first.
                  if (newValue === "") {
                    setAdditionalServiceTypes([]);
                  }
                }}
              >
                <option value="">Choose a service type</option>
                {availableOptionsFor(serviceType).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </label>

            {additionalServiceTypes.map((additionalType, index) => (
              <label key={index}>
                Additional service type:
                <select
                  value={additionalType}
                  onChange={(event) =>
                    handleAdditionalServiceChange(index, event.target.value)
                  }
                >
                  <option value="">Choose a service type</option>
                  {availableOptionsFor(additionalType).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="remove-service-button"
                  onClick={() => handleRemoveAdditionalService(index)}
                >
                  Remove service
                </button>
              </label>
            ))}

            <button
              type="button"
              className="add-service-button"
              onClick={handleAddAdditionalService}
              disabled={!canAddMore}
            >
              Add additional service +
            </button>

            <label>
              Notes:
              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Optional notes"
              />
            </label>

            <button
              type="button"
              className="book-button"
              onClick={onBook}
              disabled={bookingLoading}
            >
              {bookingLoading ? "Booking..." : "Book Appointment"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default SlotBookingForm;