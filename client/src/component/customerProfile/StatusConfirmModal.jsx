const overlayStyle = {
  position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex", alignItems: "center", justifyContent: "center",
};
 
const boxStyle = { backgroundColor: "white", padding: "20px", minWidth: "300px" };
 
// ---------------------------------------------------------------------------
// Activate/Deactivate confirmation modal. Renders nothing if `popup.show`
// is false. `popup` shape matches useCustomerProfile().statusPopup.
// ---------------------------------------------------------------------------
function StatusConfirmModal({ popup, customer, isActive }) {
  const { show, loading, error, close, onConfirm } = popup;
 
  if (!show) return null;
 
  return (
    <div style={overlayStyle}>
      <div style={boxStyle}>
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