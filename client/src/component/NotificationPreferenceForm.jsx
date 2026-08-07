import "./NotificationPreferenceForm.css";

function NotificationPreferenceForm({ fields, prefs, setPref, onSave, message }) {
  return (
    <div>
      {fields.map(({ key, label, locked }) => (
        <div key={key}>
          <label>
            <input
              type="checkbox"
              checked={locked ? true : prefs[key]}
              disabled={locked}
              onChange={(e) => setPref(key, e.target.checked)}
            />
            {" "}{label}
            {locked && <span className="locked-note-inline"> (always on)</span>}
          </label>
          <br /><br />
        </div>
      ))}

      <button onClick={onSave}>Save Preferences</button>

      {message && <p className="save-success-text">{message}</p>}
    </div>
  );
}

export default NotificationPreferenceForm;