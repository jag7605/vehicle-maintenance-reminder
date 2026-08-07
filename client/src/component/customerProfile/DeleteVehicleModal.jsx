import "./DeleteVehicleModal.css";

function DeleteVehicleModal({ popup }) {
  const { vehicle, loading, error, close, onConfirm } = popup;

  if (!vehicle) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Delete Vehicle: {vehicle.make} {vehicle.model}</h3>
        <p>Year: {vehicle.year}</p>
        <p>Rego: {vehicle.rego}</p>
        <p>Mileage: {vehicle.mileage}</p>
        <p>Are you sure you want to delete this vehicle?</p>

        {error && <p className="error-text">{error}</p>}

        <button onClick={onConfirm} disabled={loading}>
          {loading ? "Deleting..." : "Delete"}
        </button>{" "}
        <button type="button" onClick={close}>Cancel</button>
      </div>
    </div>
  );
}

export default DeleteVehicleModal;