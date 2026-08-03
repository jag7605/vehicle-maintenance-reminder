import { overlayStyle, modalBoxStyle } from "../modalStyles";

function SendNotificationModal({ popup }) {
  const { vehicle, wofDuePastDue, oilChangeDuePastDue, error, loading, close, onSelect } = popup;

  if (!vehicle) return null;

  return (
    <div style={overlayStyle}>
      <div style={modalBoxStyle}>
        <h3>Send Notification: {vehicle.make} {vehicle.model} ({vehicle.rego})</h3>
        <p>Choose which message to send to the customer.</p>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
          <button
            onClick={() => onSelect("wofDue")}
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Sending..." : wofDuePastDue ? "Send Overdue WoF Reminder" : "WoF Due"}
          </button>

          <button
            onClick={() => onSelect("oilChangeDue")}
            disabled={loading}
            style={{ width: "100%" }}
          >
            {loading ? "Sending..." : oilChangeDuePastDue ? "Send Overdue Oil Change Reminder" : "Oil Change Due"}
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