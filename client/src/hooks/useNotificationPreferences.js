import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";
import { enableBrowserPush, disableBrowserPush } from "../utils/pushSubscription";

// ---------------------------------------------------------------------------
// useNotificationPreferences
//
// Generic hook for any page that reads/writes the current user's
// `notificationPreferences` map on their Firestore user doc. Pass the set
// of preference keys (and their default values) this particular page cares
// about — admin and customer pages have different fields, so each page
// supplies its own `defaultFields`.
//
// `lockedFields` (optional) — keys that must always be `true` and cannot be
// turned off (e.g. mandatory SMS). See setPref()/save() below.
//
// `pushManagedFields` (optional) — keys that, when toggled, should also
// enable/disable a real browser push subscription (not just flip the
// Firestore flag). This is what keeps the settings-page toggle and the
// NotificationPopup's Allow/Not Now buttons in sync — both call the same
// enableBrowserPush()/disableBrowserPush() helpers under the hood, so
// there's one source of truth for what "browser: true" actually means.
// Typically just ["browser"].
//
// Example:
//   const { prefs, setPref, save, message } = useNotificationPreferences(
//     { browser: false, email: false, sms: true },
//     ["sms"],
//     ["browser"]
//   );
// ---------------------------------------------------------------------------
export function useNotificationPreferences(defaultFields, lockedFields = [], pushManagedFields = []) {
  const [currentUser, setCurrentUser] = useState(null);
  const [prefs, setPrefs] = useState(defaultFields);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) return;

      setCurrentUser(user);

      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const savedPrefs = userSnap.data().notificationPreferences;

        if (savedPrefs) {
          setPrefs((prev) => {
            const merged = { ...prev };
            for (const key of Object.keys(defaultFields)) {
              merged[key] = savedPrefs[key] || false;
            }
            for (const key of lockedFields) {
              merged[key] = true;
            }
            return merged;
          });
        }
      }
    });

    return () => unsubscribe();
    // defaultFields/lockedFields/pushManagedFields are only used for their
    // shape on first load — intentionally not dependencies, since passing
    // fresh literals every render would otherwise re-subscribe every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // setPref is async now (it awaits the push subscribe/unsubscribe for
  // push-managed fields) — callers already just fire-and-forget it from
  // an onChange handler, so this is a safe, non-breaking change.
  async function setPref(key, value) {
    if (lockedFields.includes(key)) return; // locked — ignore attempts to change

    // Optimistically reflect the checkbox change immediately
    setPrefs((prev) => ({ ...prev, [key]: value }));

    if (pushManagedFields.includes(key) && currentUser) {
      try {
        if (value) {
          await enableBrowserPush(currentUser.uid);
        } else {
          await disableBrowserPush(currentUser.uid);
        }
      } catch (err) {
        console.error(`Failed to ${value ? "enable" : "disable"} push for "${key}":`, err);
        // Revert the checkbox — we couldn't actually back up the change
        // with a real subscription, so don't leave the UI showing "on"
        // for something that isn't.
        setPrefs((prev) => ({ ...prev, [key]: false }));
        setMessage(
          value
            ? "Couldn't enable browser notifications. Check that notifications are allowed for this site."
            : ""
        );
        return;
      }
    }
  }

  async function save() {
    if (!currentUser) return;

    const payload = { ...prefs };
    for (const key of lockedFields) {
      payload[key] = true;
    }

    await setDoc(
      doc(db, "users", currentUser.uid),
      { notificationPreferences: payload },
      { merge: true }
    );

    setMessage("Preferences saved.");
  }

  return { prefs, setPref, save, message };
}