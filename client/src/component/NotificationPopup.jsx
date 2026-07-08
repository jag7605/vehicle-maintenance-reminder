import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { savePushSubscription, clearPushSubscription } from "../firebase/users";
import { urlBase64ToUint8Array } from "../utils/pushSubscriptionHelpers";
import "./NotificationPopup.css";

// Must match the server's VAPID_PUBLIC_KEY (same keypair on both ends) —
// set VITE_VAPID_PUBLIC_KEY in your frontend .env to the same public key
// value used server-side.
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

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

  // ---------------------------------------------------------------------
  // Registers the service worker (if not already), subscribes to push via
  // PushManager, and saves the resulting subscription to Firestore. This
  // is the piece that actually makes sendPush() work server-side — asking
  // for Notification permission alone (the old behavior) doesn't create a
  // subscription, so the server has nothing to send to.
  // ---------------------------------------------------------------------
  async function subscribeToPush() {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      throw new Error("Push notifications aren't supported in this browser.");
    }
    if (!VAPID_PUBLIC_KEY) {
      throw new Error("Missing VITE_VAPID_PUBLIC_KEY — check your .env file.");
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    // Wait until the service worker is actually active before subscribing —
    // subscribing too early against a still-installing worker can fail.
    await navigator.serviceWorker.ready;

    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ||
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      }));

    await savePushSubscription(currentUser.uid, subscription);
  }

  const handleAllow = async () => {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      try {
        await subscribeToPush();
        await savePreference(true);
        new Notification("Notifications enabled");
      } catch (err) {
        console.error("Push subscription failed:", err);
        // Permission was granted but the subscription itself failed (e.g.
        // unsupported browser, missing VAPID key, network issue). Don't
        // save browser:true if we don't actually have a working
        // subscription to back it up.
        await savePreference(false);
      }
    } else {
      await savePreference(false);
    }
  };

  const handleDecline = async () => {
    // Clear any existing subscription so the backend doesn't keep trying
    // to push to a customer who declined.
    if (currentUser) {
      try {
        await clearPushSubscription(currentUser.uid);
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