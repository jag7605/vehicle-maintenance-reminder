import { MdWarningAmber, MdCheckCircleOutline } from "react-icons/md";
import "./StatusConfirmModal.css";

function StatusConfirmModal({ popup, customer, isActive }) {
  const { show, loading, error, close, onConfirm } = popup;

  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className={`modal-box ${isActive ? "modal-box-warning" : "modal-box-positive"}`}>
        <h3>
          {isActive ? "Deactivate" : "Activate"} {customer.firstName} {customer.lastName}
        </h3>

        <div className={`modal-status-banner ${isActive ? "warning" : "positive"}`}>
          {isActive ? <MdWarningAmber size={20} /> : <MdCheckCircleOutline size={20} />}
          <p>
            {isActive
              ? "They will not be able to log in until reactivated."
              : "They will be able to log in again immediately."}
          </p>
        </div>

        {error && <p className="error-text">{error}</p>}

        <div className="modal-actions modal-actions-end">
          <button type="button" className="btn btn-secondary" onClick={close}>
            Cancel
          </button>
          <button
            className={isActive ? "btn btn-danger" : "btn btn-primary"}
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