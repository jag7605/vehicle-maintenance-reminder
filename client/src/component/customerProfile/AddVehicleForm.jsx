import { vehicleMakesModels } from "../../data/vehicleMakesModels";

function AddVehicleForm({ customerName, form }) {
  const {
    make,
    model,
    year,
    mileage,
    rego,
    error,
    success,
    loading,
    availableModels,
    setMake,
    setModel,
    setYear,
    setMileage,
    setRego,
    onSubmit,
  } = form;
 
  return (
    <>
      <h2>Add Vehicle for {customerName}</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label>Make</label><br />
          <select value={make} onChange={setMake} required>
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
    </>
  );
}
 
export default AddVehicleForm;