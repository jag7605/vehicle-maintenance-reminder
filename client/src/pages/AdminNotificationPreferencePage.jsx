import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import StaffLayout from "../component/StaffLayout";

function AdminNotificationPreferencePage() {
  const [currentUser, setCurrentUser] = useState(null);

  const [browser, setBrowser] = useState(false);
  const [email, setEmail] = useState(false);
  const [newJobs, setNewJobs] = useState(false);
  const [newBookings, setNewBookings] = useState(false);

  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      setCurrentUser(user);

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const prefs = userSnap.data().notificationPreferences;

        if (prefs) {
          setBrowser(prefs.browser || false);
          setEmail(prefs.email || false);
          setNewJobs(prefs.newJobs || false);
          setNewBookings(prefs.newBookings || false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleSave = async () => {
    if (!currentUser) return;

    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        notificationPreferences: {
          browser,
          email,
          newJobs,
          newBookings,
        },
      },
      { merge: true }
    );

    setMessage("Preferences saved.");
  };

  return (
    <StaffLayout title="Notification Preferences">
      <h2>Notification Preferences</h2>

      <label>
        <input
          type="checkbox"
          checked={browser}
          onChange={(e) => setBrowser(e.target.checked)}
        />
        Browser Notifications
      </label>

      <br /><br />

      <label>
        <input
          type="checkbox"
          checked={email}
          onChange={(e) => setEmail(e.target.checked)}
        />
        Email Notifications
      </label>

      <br /><br />

      <label>
        <input
          type="checkbox"
          checked={newJobs}
          onChange={(e) => setNewJobs(e.target.checked)}
        />
        New Job Alerts
      </label>

      <br /><br />

      <label>
        <input
          type="checkbox"
          checked={newBookings}
          onChange={(e) => setNewBookings(e.target.checked)}
        />
        New Booking Alerts
      </label>

      <br /><br />

      <button onClick={handleSave}>Save Preferences</button>

      {message && <p style={{ color: "green" }}>{message}</p>}
    </StaffLayout>
  );
  
}

export default AdminNotificationPreferencePage;