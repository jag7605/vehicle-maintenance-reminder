import { useNotificationPreferences } from "../hooks/useNotificationPreferences";
import NotificationPreferenceForm from "../component/NotificationPreferenceForm";
 
const FIELDS = [
  { key: "browser", label: "Browser Notifications" },
  { key: "email", label: "Email Notifications" },
  { key: "sms", label: "SMS Notifications", locked: true },
];
 
const DEFAULTS = { browser: false, email: false, sms: true };
const LOCKED_FIELDS = ["sms"];
const PUSH_MANAGED_FIELDS = ["browser"];

function CustomerProfilePage() {
  const { prefs, setPref, save, message } = useNotificationPreferences(
    DEFAULTS,
    LOCKED_FIELDS,
    PUSH_MANAGED_FIELDS
  );
 
  return (
    <div>
      <h2>Notification Preferences</h2>
      <NotificationPreferenceForm
        fields={FIELDS}
        prefs={prefs}
        setPref={setPref}
        onSave={save}
        message={message}
      />
    </div>
  );
}
 
export default CustomerProfilePage;