import { useEffect, useState } from "react";
import { useNotificationPreferences } from "../hooks/useNotificationPreferences";
import NotificationPreferenceForm from "../component/NotificationPreferenceForm";
import { auth } from "../firebase/firebaseConfig";
import { getCustomerById } from "../firebase/users";
import "./CustomerProfilePage.css";

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

  const [customer, setCustomer] = useState(null);

  useEffect(() => {
    async function loadCustomer() {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const data = await getCustomerById(user.uid);
        setCustomer(data);
      } catch (err) {
        console.error("Failed to load customer profile:", err);
      }
    }

    loadCustomer();
  }, []);

  const user = auth.currentUser;
  const customerName = customer
    ? `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "Customer"
    : "Customer";
  const customerEmail = customer?.email || user?.email || "No email provided";
  const customerPhone = customer?.phone || "No phone number provided";
  const initials = customerName.split(" ").map((name) => name.charAt(0)).join("").slice(0, 2).toUpperCase();

  return (
    <div className="customer-profile-page">
      <h1 className="customer-profile-title">Profile</h1>

      <div className="customer-profile-banner">
        <div className="customer-profile-user">
          <div className="customer-profile-avatar">
            {initials}
          </div>
          <div>

            <h2>
              {customerName}
            </h2>

            <p>
              Customer account
            </p>

          </div>
        </div>
      </div>

      <div className="customer-profile-contact-grid">
        <div className="customer-profile-contact-card">
          <p className="customer-profile-label">EMAIL</p>

          <strong>
            {customerEmail}
          </strong>

          <span>
            Primary contact email
          </span>

        </div>
        <div className="customer-profile-contact-card">
          <p className="customer-profile-label">PHONE</p>

          <strong>
            {customerPhone}
          </strong>

          <span>
            Primary contact number
          </span>

        </div>

      </div>

      <div className="customer-profile-preferences">

        <p className="customer-profile-label">
          NOTIFICATION PREFERENCES
        </p>

        <NotificationPreferenceForm
          fields={FIELDS}
          prefs={prefs}
          setPref={setPref}
          onSave={save}
          message={message}
        />

      </div>

    </div>
  );
}

export default CustomerProfilePage;