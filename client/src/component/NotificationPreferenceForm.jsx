import "./NotificationPreferenceForm.css";

function NotificationPreferenceForm({ fields, prefs, setPref, onSave, message }) {
  return (
    <div className="notification-preference-form">

      <div className="preference-list">

        {fields.map(({ key, label, locked }) => (
          <div key={key} className="preference-row">

            <div className="preference-info">

              <p className="preference-title">
                {label}
              </p>

              {key === "email" && (
                <p className="preference-description">
                  Receive service reminders via email.
                </p>
              )}

              {key === "browser" && (
                <p className="preference-description">
                  Receive service reminders via browser notifications.
                </p>
              )}

              {key === "sms" && (
                <p className="preference-description">
                  SMS notifications are currently unavailable.
                </p>
              )}

            </div>


            {locked ? (
              <span className="locked-note-inline">
                Unavailable
              </span>
            ) : (
              <label className="preference-toggle">

                <input
                  type="checkbox"
                  checked={prefs[key]}
                  onChange={(e) =>
                    setPref(key, e.target.checked)
                  }
                />

                <span className="preference-slider"></span>

              </label>
            )}

          </div>
        ))}

      </div>


      <div className="preference-save-area">

        <button
          type="button"
          className="preference-save-button"
          onClick={onSave}
        >
          Save Preferences
        </button>

        {message && (
          <p className="save-success-text">
            {message}
          </p>
        )}

      </div>

    </div>
  );
}

export default NotificationPreferenceForm;