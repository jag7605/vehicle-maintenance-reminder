import { overlayStyle, modalBoxStyle } from "../modalStyles";

function StatusConfirmModal({ popup, customer, isActive }) {
  const { show, loading, error, close, onConfirm } = popup;
 
  if (!show) return null;
 
  return (
    <div style={overlayStyle}>
      <div style={modalBoxStyle}>
        <h3>
          {isActive ? "Deactivate" : "Activate"} {customer.firstName} {customer.lastName}
        </h3>
        {isActive && <p>They will not be able to log in until reactivated.</p>}
 
        {error && <p style={{ color: "red" }}>{error}</p>}
 
        <button onClick={onConfirm} disabled={loading}>
          {loading ? "Updating..." : isActive ? "Deactivate" : "Activate"}
        </button>{" "}
        <button type="button" onClick={close}>Cancel</button>
      </div>
    </div>
  );
}
 
export default StatusConfirmModal;
 