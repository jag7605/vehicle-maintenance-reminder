import "./DeleteVehicleModal.css";

function DeleteVehicleModal({ popup }) {
  const { vehicle, loading, error, close, onConfirm } = popup;

  if (!vehicle) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Delete Vehicle: {vehicle.make} {vehicle.model}</h3>

        <div className="modal-vehicle-summary">
          <p>Year: {vehicle.year}</p>
          <p>Rego: {vehicle.rego}</p>
          <p>Mileage: {vehicle.mileage}</p>
        </div>

        <p className="modal-confirm-text">Are you sure you want to delete this vehicle?</p>

        {error && <p className="error-text">{error}</p>}

        <div className="modal-actions modal-actions-end">
          <button type="button" className="btn btn-secondary" onClick={close}>
            Cancel
          </button>
          <button className="btn btn-danger" onClick={onConfirm} disabled={loading}>
            {loading ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteVehicleModal;