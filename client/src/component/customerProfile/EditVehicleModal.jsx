import { overlayStyle, modalBoxStyle } from "../modalStyles";

 
function EditVehicleModal({ popup }) {
  const {
    vehicle,
    year,
    mileage,
    rego,
    nextWofDate,
    nextOilChangeDate,
    nextServiceMileage,
    error,
    loading,
    setYear,
    setMileage,
    setRego,
    setNextWofDate,
    setNextOilChangeDate,
    setNextServiceMileage,
    close,
    onSave,
  } = popup;
 
  if (!vehicle) return null;
 
  return (
    <div style={overlayStyle}>
      <div style={modalBoxStyle}>
        <h3>Edit Vehicle: {vehicle.make} {vehicle.model}</h3>
        <form onSubmit={onSave}>
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
            <input value={rego} onChange={(e) => setRego(e.target.value)} required />
          </div>
 
          <div>
            <label>Next WoF Date</label><br />
            <input
              type="date"
              value={nextWofDate}
              onChange={(e) => setNextWofDate(e.target.value)}
            />
            <br />
            <small>Leave blank to clear the WoF due date.</small>
          </div>

          <div>
            <label>Next Oil Change Date</label><br />
            <input
              type="date"
              value={nextOilChangeDate}
              onChange={(e) => setNextOilChangeDate(e.target.value)}
            />
            <br />
            <small>Leave blank to clear the Oil Change due date.</small>
          </div>
 
          <div>
            <label>Next Service Mileage (km)</label><br />
            <input
              type="number"
              min="0"
              value={nextServiceMileage}
              onChange={(e) => setNextServiceMileage(e.target.value)}
              placeholder="e.g. 150000"
            />
            <br />
            <small>Leave blank to clear the mileage target.</small>
          </div>
 
          {error && <p style={{ color: "red" }}>{error}</p>}
 
          <button type="submit" disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>{" "}
          <button type="button" onClick={close}>Cancel</button>
        </form>
      </div>
    </div>
  );
}
 
export default EditVehicleModal;