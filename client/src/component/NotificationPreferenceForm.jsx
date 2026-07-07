function NotificationPreferenceForm({ fields, prefs, setPref, onSave, message }) {
  return (
    <div>
      {fields.map(({ key, label }) => (
        <div key={key}>
          <label>
            <input
              type="checkbox"
              checked={prefs[key]}
              onChange={(e) => setPref(key, e.target.checked)}
            />
            {" "}{label}
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