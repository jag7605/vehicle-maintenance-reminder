import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { addVehicle, getVehiclesByOwner, updateVehicle, deleteVehicle } from "../firebase/vehicles";
import { getCustomerById, setCustomerActiveStatus } from "../firebase/users";
import { vehicleMakesModels } from "../data/vehicleMakesModels";

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
  const [editingVehicle, setEditingVehicle] = useState(null); // holds the vehicle object being edited, or null if popup closed
  const [editYear, setEditYear] = useState("");
  const [editMileage, setEditMileage] = useState("");
  const [editRego, setEditRego] = useState("");
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete popup state
  const [deletingVehicle, setDeletingVehicle] = useState(null); // holds the vehicle object being deleted, or null if popup closed
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  // Activate/Deactivate popup state
  const [showStatusConfirm, setShowStatusConfirm] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState("");

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
      await updateVehicle(editingVehicle.id, {
        year: Number(editYear),
        mileage: Number(editMileage),
        rego: editRego,
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
    // Missing "active" field defaults to true (active)
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

  const availableModels = make ? vehicleMakesModels[make] : [];

  if (pageLoading) return <p>Loading customer...</p>;
  if (pageError) return <p style={{ color: "red" }}>{pageError}</p>;

  const isActive = customer.active !== false;

  return (
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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((vehicle) => (
              <tr key={vehicle.id}>
                <td>{vehicle.year}</td>
                <td>{vehicle.make}</td>
                <td>{vehicle.model}</td>
                <td>{vehicle.rego}</td>
                <td>{vehicle.mileage}</td>
                <td>
                  <button onClick={() => openEditPopup(vehicle)}>Edit</button>{" "}
                  <button onClick={() => openDeletePopup(vehicle)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

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
                <input type="number" value={editYear} onChange={(e) => setEditYear(e.target.value)} required />
              </div>

              <div>
                <label>Mileage</label><br />
                <input type="number" value={editMileage} onChange={(e) => setEditMileage(e.target.value)} required />
              </div>

              <div>
                <label>Rego</label><br />
                <input value={editRego} onChange={(e) => setEditRego(e.target.value)} required />
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
  );
}

export default AdminCustomerProfilePage;