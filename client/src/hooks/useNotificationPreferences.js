import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

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
// turned off, e.g. making SMS mandatory for customers. Locked fields are
// forced to `true` on load (even overriding a previously saved `false`) and
// before every save, and setPref() silently ignores attempts to change them
// — the UI should also disable their checkbox via NotificationPreferenceForm's
// `locked` flag, this is just the belt-and-braces backend guarantee.
//
// ---------------------------------------------------------------------------
export function useNotificationPreferences(defaultFields, lockedFields = []) {
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
            // Locked fields always come back on, regardless of what was
            // previously saved (e.g. before the field became mandatory).
            for (const key of lockedFields) {
              merged[key] = true;
            }
            return merged;
          });
        }
      }
    });

    return () => unsubscribe();
    // defaultFields/lockedFields are only used for their shape on first load —
    // intentionally not dependencies, since passing fresh literals every
    // render would otherwise re-subscribe on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function setPref(key, value) {
    if (lockedFields.includes(key)) return; // locked — ignore attempts to change
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    if (!currentUser) return;

    // Belt-and-braces: force locked fields to true in the saved payload too,
    // in case prefs state was ever set directly some other way.
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