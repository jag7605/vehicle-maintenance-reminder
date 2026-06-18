import { useState } from "react";
import { useParams } from "react-router-dom";
import { addVehicle } from "../firebase/vehicles";
import { vehicleMakesModels } from "../data/vehicleMakesModels";

function AdminCustomerProfilePage() {
  const { customerId } = useParams();

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [mileage, setMileage] = useState("");
  const [rego, setRego] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  function handleMakeChange(e) {
    setMake(e.target.value);
    setModel(""); // reset model whenever make changes, so a stale model from a different make can't carry over
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
    } catch {
      setError("Something went wrong while adding the vehicle.");
    } finally {
      setLoading(false);
    }
  }

  const availableModels = make ? vehicleMakesModels[make] : [];

  return (
    <div>
      <p>Customer Profile Page</p>
      <p>Customer ID: {customerId}</p>

      <h2>Add Vehicle</h2>
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
          <input value={rego} onChange={(e) => setRego(e.target.value)} required />
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Add Vehicle"}
        </button>
      </form>
    </div>
  );
}

export default AdminCustomerProfilePage;