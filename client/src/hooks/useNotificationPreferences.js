import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

export function useNotificationPreferences(defaultFields) {
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
            return merged;
          });
        }
      }
    });
 
    return () => unsubscribe();
    // defaultFields is only used for its keys/shape on first load — intentionally
    // not a dependency, since passing a fresh object literal every render would
    // otherwise re-subscribe on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
 
  function setPref(key, value) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }
 
  async function save() {
    if (!currentUser) return;
 
    await setDoc(
      doc(db, "users", currentUser.uid),
      { notificationPreferences: prefs },
      { merge: true }
    );
 
    setMessage("Preferences saved.");
  }
 
  return { prefs, setPref, save, message };
}