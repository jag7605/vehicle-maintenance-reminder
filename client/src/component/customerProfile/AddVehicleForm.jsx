import { vehicleMakesModels } from "../../data/vehicleMakesModels";
import MessagePopup from "../MessagePopup";
import { isPastDate, formatDate } from "../../utils/formatters";
import "../FormControls.css";

function AddVehicleForm({ customerName, form }) {
  const {
    make,
    model,
    year,
    mileage,
    rego,
    lastWofDate,
    lastOilChangeDate,
    error,
    loading,
    availableModels,
    addedVehicleDetails,
    setMake,
    setModel,
    setYear,
    setMileage,
    setRego,
    setLastWofDate,
    setLastOilChangeDate,
    onSubmit,
    closeAddedVehicleDetails,
  } = form;

  function buildConfirmationMessage(details) {
    const wofLine = details.nextWofDate
      ? `Next WoF Date: ${formatDate(details.nextWofDate)}${
          isPastDate(details.nextWofDate) ? " (Overdue)" : ""
        }`
      : "Next WoF Date: —";

    const oilChangeLine = details.nextOilChangeDate
      ? `Next Oil Change Date: ${formatDate(details.nextOilChangeDate)}${
          isPastDate(details.nextOilChangeDate) ? " (Overdue)" : ""
        }`
      : "Next Oil Change Date: —";

    return (
      `Vehicle added successfully.\n\n` +
      `${details.year} ${details.make} ${details.model} (${details.rego})\n` +
      `${wofLine}\n` +
      `${oilChangeLine}`
    );
  }

  return (
    <>
      <h2>Add Vehicle for {customerName}</h2>
      <form onSubmit={onSubmit} className="standalone-form">
        <div>
          <label>Make</label><br />
          <select className="select-control" value={make} onChange={setMake} required>
            <option value="" disabled>Select a make</option>
            {Object.keys(vehicleMakesModels).map((makeOption) => (
              <option key={makeOption} value={makeOption}>{makeOption}</option>
            ))}
          </select>
        </div>

        <div>
          <label>Model</label><br />
          <select
            className="select-control"
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
          <input className="input-control" type="number" value={year} onChange={(e) => setYear(e.target.value)} required />
        </div>

        <div>
          <label>Mileage</label><br />
          <input className="input-control" type="number" value={mileage} onChange={(e) => setMileage(e.target.value)} required />
        </div>

        <div>
          <label>Rego</label><br />
          <input className="input-control" value={rego} onChange={(e) => setRego(e.target.value.toUpperCase())} required />
        </div>

        <div>
          <label>Last WoF Date (optional)</label><br />
          <input
            className="input-control"
            type="date"
            value={lastWofDate}
            onChange={(e) => setLastWofDate(e.target.value)}
          />
          <br />
          <small>
            If known, we'll calculate the next WoF due date from this date instead of today.
          </small>
        </div>

        <div>
          <label>Last Oil Change Date (optional)</label><br />
          <input
            className="input-control"
            type="date"
            value={lastOilChangeDate}
            onChange={(e) => setLastOilChangeDate(e.target.value)}
          />
          <br />
          <small>
            If known, we'll calculate the next Oil Change due date automatically.
          </small>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div>
          {/* Invisible label matching the shape of every other field's
              label — this is what actually aligns the button with the
              inputs beside it (same top offset), rather than trying to
              guess a pixel margin that would break if label size/spacing
              ever changes. */}
          <label aria-hidden="true">&nbsp;</label><br />
          <button type="submit" className={`btn ${loading ? "btn-disabled" : "btn-primary"}`} disabled={loading}>
            {loading ? "Saving..." : "Add Vehicle"}
          </button>
        </div>
      </form>

      {addedVehicleDetails && (
        <MessagePopup
          message={buildConfirmationMessage(addedVehicleDetails)}
          onClose={closeAddedVehicleDetails}
        />
      )}
    </>
  );
}

export default AddVehicleForm;