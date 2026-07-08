import { overlayStyle, modalBoxStyle } from "../modalStyles";

// ---------------------------------------------------------------------------
// Send Notification popup. Renders nothing if `popup.vehicle` is null.
// Asks the admin to choose between a "Service Due" and a "Car Ready"
// message before anything is sent. `popup` shape matches
// useCustomerProfile().notifyPopup.
// ---------------------------------------------------------------------------
function SendNotificationModal({ popup }) {
  const { vehicle, error, loading, close, onSelect } = popup;

  if (!vehicle) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalBoxStyle}>
        <h3>Send Notification: {vehicle.make} {vehicle.model} ({vehicle.rego})</h3>
        <p>Choose which message to send to the customer.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
          <button onClick={() => onSelect("serviceDue")} disabled={loading}>
            {loading ? "Sending..." : "Service Due"}
          </button>
          <button onClick={() => onSelect("carReady")} disabled={loading}>
            {loading ? "Sending..." : "Your Car Is Ready"}
          </button>
        </div>

        {error && <p style={{ color: "red", marginTop: "12px" }}>{error}</p>}

        <div style={{ marginTop: "16px" }}>
          <button type="button" onClick={close} disabled={loading}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default SendNotificationModal;