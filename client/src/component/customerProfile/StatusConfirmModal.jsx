import "./StatusConfirmModal.css";

function StatusConfirmModal({ popup, customer, isActive }) {
  const { show, loading, error, close, onConfirm } = popup;

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>
          {isActive ? "Deactivate" : "Activate"} {customer.firstName} {customer.lastName}
        </h3>
        {isActive && <p>They will not be able to log in until reactivated.</p>}

        {error && <p className="error-text">{error}</p>}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={close}>Cancel</button>
          <button
            className={`btn ${loading ? "btn-disabled" : isActive ? "btn-danger" : "btn-primary"}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Updating..." : isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default StatusConfirmModal;