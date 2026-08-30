import "./Sendnotificationmodal.css";

function SendNotificationModal({ popup }) {
  const { vehicle, wofDuePastDue, oilChangeDuePastDue, error, loading, close, onSelect } = popup;

  if (!vehicle) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <h3>Send Notification: {vehicle.make} {vehicle.model} ({vehicle.rego})</h3>
        <p>Choose which message to send to the customer.</p>

        <div className="notif-option-list">
          <button
            onClick={() => onSelect("wofDue")}
            disabled={loading}
            className={`btn btn-full-width ${loading ? "btn-disabled" : "btn-secondary"}`}
          >
            {loading ? "Sending..." : wofDuePastDue ? "Send Overdue WoF Reminder" : "WoF Due"}
          </button>

          <button
            onClick={() => onSelect("oilChangeDue")}
            disabled={loading}
            className={`btn btn-full-width ${loading ? "btn-disabled" : "btn-secondary"}`}
          >
            {loading ? "Sending..." : oilChangeDuePastDue ? "Send Overdue Oil Change Reminder" : "Oil Change Due"}
          </button>

          <button
            onClick={() => onSelect("carReady")}
            disabled={loading}
            className={`btn btn-full-width ${loading ? "btn-disabled" : "btn-primary"}`}
          >
            {loading ? "Sending..." : "Your Car Is Ready"}
          </button>
        </div>

        {error && <p className="error-text modal-error-spacing">{error}</p>}

        <div className="modal-cancel-row">
          <button type="button" className="btn btn-secondary" onClick={close} disabled={loading}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

export default SendNotificationModal;