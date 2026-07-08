import StaffLayout from "../component/StaffLayout";
import { useNotificationPreferences } from "../hooks/useNotificationPreferences";
import NotificationPreferenceForm from "../component/NotificationPreferenceForm";

const FIELDS = [
  { key: "browser", label: "Browser Notifications" },
  { key: "email", label: "Email Notifications" },
  { key: "sms", label: "SMS Notifications" },
];

const DEFAULTS = { browser: false, email: false, sms: false };

function AdminNotificationPreferencePage() {
  const { prefs, setPref, save, message } = useNotificationPreferences(DEFAULTS);

  return (
    <StaffLayout title="Notification Preferences">
      <h2>Notification Preferences</h2>
      <NotificationPreferenceForm
        fields={FIELDS}
        prefs={prefs}
        setPref={setPref}
        onSave={save}
        message={message}
      />
    </StaffLayout>
  );
}

export default AdminNotificationPreferencePage;