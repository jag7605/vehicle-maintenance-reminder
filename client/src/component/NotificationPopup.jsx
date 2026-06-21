import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import "./NotificationPopup.css";

function NotificationPopup() {
  const [showPopup, setShowPopup] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [role, setRole] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      setCurrentUser(user);

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return;

      const data = userSnap.data();
      setRole(data.role);

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
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      await savePreference(true);
      new Notification("Notifications enabled");
    } else {
      await savePreference(false);
    }
  };

  const handleDecline = async () => {
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

      <div className="popup-buttons">
        <button className="allow-btn" onClick={handleAllow}>
          Allow Notifications
        </button>

        <button className="decline-btn" onClick={handleDecline}>
          Not Now
        </button>
      </div>
    </div>
  </div>
);
}

export default NotificationPopup;