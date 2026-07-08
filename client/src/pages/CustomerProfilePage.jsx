import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebaseConfig";

function CustomerProfilePage() {
    const [currentUser, setCurrentUser] = useState(null);

    const [browser, setBrowser] = useState(true);
    const [email, setEmail] = useState(true);
    const [sms, setSms] = useState(true);

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
                    setBrowser(prefs.browser ?? true);
                    setEmail(prefs.email ?? true);

                    // SMS is locked on for this sprint.
                    setSms(true);
                }
            }
        });

        return () => unsubscribe();
    }, []);

    const handleBrowserChange = (checked) => {
        if (checked === false && email === false) {
            setMessage("At least one working channel must stay enabled.");
            return;
        }

        setBrowser(checked);
        setMessage("");
    };

    const handleEmailChange = (checked) => {
        if (checked === false && browser === false) {
            setMessage("At least one working channel must stay enabled.");
            return;
        }

        setEmail(checked);
        setMessage("");
    };

    const handleSave = async () => {
        if (!currentUser) return;

        await setDoc(
            doc(db, "users", currentUser.uid),
            {
                notificationPreferences: {
                    browser,
                    email,
                    sms: true,
                },
            },
            { merge: true }
        );

        setSms(true);
        setMessage("Preferences saved.");
    };

    return (
        <div>
            <h2>Notification Preferences</h2>

            <label>
                <input
                    type="checkbox"
                    checked={browser}
                    onChange={(e) => handleBrowserChange(e.target.checked)}
                />
                Browser Notifications
            </label>

            <br />
            <br />

            <label>
                <input
                    type="checkbox"
                    checked={email}
                    onChange={(e) => handleEmailChange(e.target.checked)}
                />
                Email Notifications
            </label>

            <br />
            <br />

            <label style={{ color: "gray" }}>
                <input
                    type="checkbox"
                    checked={sms}
                    disabled
                    readOnly
                />
                SMS Notifications
            </label>

            <br />
            <br />

            <button onClick={handleSave}>Save Preferences</button>

            {message && (
                <p style={{ color: message.includes("saved") ? "green" : "red" }}>
                    {message}
                </p>
            )}
        </div>
    );
}

export default CustomerProfilePage;
