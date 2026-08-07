import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { enableBrowserPush, disableBrowserPush } from "../utils/pushSubscription";
import "./NotificationPopup.css";

function NotificationPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      setCurrentUser(user);

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return;

      const data = userSnap.data();

      if (data.notificationPreferences?.browser === undefined) {
        setShowPopup(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const savePreference = async (enabled) => {
    if (!currentUser) return;

    await setDoc(
      doc(db, "users", currentUser.uid),
      {
        notificationPreferences: {
          browser: enabled,
        },
      },
      { merge: true }
    );

    setShowPopup(false);
  };

  const handleAllow = async () => {
    setError("");
    setLoading(true);

    try {
      await enableBrowserPush(currentUser.uid);
      await savePreference(true);
      new Notification("Notifications enabled");
    } catch (err) {
      console.error("Push subscription failed:", err);

      // Give a specific, actionable message for the most common real
      // cause — the browser already has this site blocked, so
      // requestPermission() resolves instantly with no visible prompt.
      if (err.message === "Notification permission was not granted.") {
        setError(
          "Notifications are blocked for this site in your browser. " +
          "Click the lock icon in the address bar, set Notifications to " +
          "\"Allow\" (or reset it), then try again."
        );
      } else {
        setError(err.message || "Something went wrong enabling notifications.");
      }

      // Don't save browser:true if we don't actually have a working
      // subscription to back it up.
      await savePreference(false);
    } finally {
      setLoading(false);
    }
  };

  const handleDecline = async () => {
    if (currentUser) {
      try {
        await disableBrowserPush(currentUser.uid);
      } catch {
        // non-critical — worst case sendPush() fails silently later
      }
    }
    await savePreference(false);
  };

  if (!showPopup) return null;

  return (
  <div className="popup-overlay">
    <div className="popup-box">
      <div className="popup-icon">🔔</div>

      <h2>Enable Notifications?</h2>

      <p>
        Receive booking updates, service reminders, and vehicle status alerts.
      </p>

      {error && (
        <p className="popup-error-text">
          {error}
        </p>
      )}

      <div className="popup-buttons">
        <button className="allow-btn" onClick={handleAllow} disabled={loading}>
          {loading ? "Requesting..." : "Allow Notifications"}
        </button>

        <button className="decline-btn" onClick={handleDecline} disabled={loading}>
          Not Now
        </button>
      </div>
    </div>
  </div>
);
}

export default NotificationPopup;