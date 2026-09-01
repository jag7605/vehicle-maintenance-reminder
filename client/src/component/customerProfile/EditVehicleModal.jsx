import "./EditVehicleModal.css";
import "../FormControls.css";

function EditVehicleModal({ popup }) {
  const {
    vehicle,
    year,
    mileage,
    rego,
    nextWofDate,
    nextOilChangeDate,
    error,
    loading,
    setYear,
    setMileage,
    setRego,
    setNextWofDate,
    setNextOilChangeDate,
    close,
    onSave,
  } = popup;

  if (!vehicle) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Edit Vehicle: {vehicle.make} {vehicle.model}</h3>
        <form onSubmit={onSave}>
          <div className="modal-field-group">
            <label className="modal-field-label">Year</label>
            <input
              className="modal-field-input"
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              required
            />
          </div>

          <div className="modal-field-group">
            <label className="modal-field-label">Mileage</label>
            <input
              className="modal-field-input"
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              required
            />
          </div>

          <div className="modal-field-group">
            <label className="modal-field-label">Rego</label>
            <input
              className="modal-field-input"
              value={rego}
              onChange={(e) => setRego(e.target.value)}
              required
            />
          </div>

          <div className="modal-field-group">
            <label className="modal-field-label">Next WoF Date</label>
            <input
              className="modal-field-input"
              type="date"
              value={nextWofDate}
              onChange={(e) => setNextWofDate(e.target.value)}
            />
            <small className="modal-field-hint">Leave blank to clear the WoF due date.</small>
          </div>

          <div className="modal-field-group">
            <label className="modal-field-label">Next Oil Change Date</label>
            <input
              className="modal-field-input"
              type="date"
              value={nextOilChangeDate}
              onChange={(e) => setNextOilChangeDate(e.target.value)}
            />
            <small className="modal-field-hint">Leave blank to clear the Oil Change due date.</small>
          </div>

          {error && <p className="error-text">{error}</p>}

          <div className="modal-actions modal-actions-end">
            <button type="button" className="btn btn-secondary" onClick={close}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditVehicleModal;