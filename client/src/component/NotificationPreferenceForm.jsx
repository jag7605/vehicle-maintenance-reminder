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
            {locked && <span style={{ color: "#888" }}> (always on)</span>}
          </label>
          <br /><br />
        </div>
      ))}
 
      <button onClick={onSave}>Save Preferences</button>
 
      {message && <p style={{ color: "green" }}>{message}</p>}
    </div>
  );
}
 
export default NotificationPreferenceForm;