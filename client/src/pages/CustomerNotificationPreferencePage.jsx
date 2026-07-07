// import { useEffect, useState } from "react";
// import { onAuthStateChanged } from "firebase/auth";
// import { doc, getDoc, setDoc } from "firebase/firestore";
// import { auth, db } from "../firebase/firebaseConfig";

// function CustomerNotificationPreferencePage() {
//   const [currentUser, setCurrentUser] = useState(null);

//   const [browser, setBrowser] = useState(false);
//   const [sms, setSms] = useState(false);
//   const [email, setEmail] = useState(false);
//   const [serviceReminders, setServiceReminders] = useState(false);
//   const [vehicleReady, setVehicleReady] = useState(false);

//   const [message, setMessage] = useState("");

//   useEffect(() => {
//     const unsubscribe = onAuthStateChanged(auth, async (user) => {
//       if (!user) return;

//       setCurrentUser(user);

//       const userRef = doc(db, "users", user.uid);
//       const userSnap = await getDoc(userRef);

//       if (userSnap.exists()) {
//         const prefs = userSnap.data().notificationPreferences;

//         if (prefs) {
//           setBrowser(prefs.browser || false);
//           setSms(prefs.sms || false);
//           setEmail(prefs.email || false);
//           setServiceReminders(prefs.serviceReminders || false);
//           setVehicleReady(prefs.vehicleReady || false);
//         }
//       }
//     });

//     return () => unsubscribe();
//   }, []);

//   const handleSave = async () => {
//     if (!currentUser) return;

//     await setDoc(
//       doc(db, "users", currentUser.uid),
//       {
//         notificationPreferences: {
//           browser,
//           sms,
//           email,
//           serviceReminders,
//           vehicleReady,
//         },
//       },
//       { merge: true }
//     );

//     setMessage("Preferences saved.");
//   };

//   return (
//     //<CustomerLayout title="Notification Preferences">
//     <div>
//       <h2>Notification Preferences</h2>

//       <label>
//         <input
//           type="checkbox"
//           checked={browser}
//           onChange={(e) => setBrowser(e.target.checked)}
//         />
//         Browser Notifications
//       </label>

//       <br /><br />

//       <label>
//         <input
//           type="checkbox"
//           checked={sms}
//           onChange={(e) => setSms(e.target.checked)}
//         />
//         SMS Notifications
//       </label>

//       <br /><br />

//       <label>
//         <input
//           type="checkbox"
//           checked={email}
//           onChange={(e) => setEmail(e.target.checked)}
//         />
//         Email Notifications
//       </label>

//       <br /><br />

//       <label>
//         <input
//           type="checkbox"
//           checked={serviceReminders}
//           onChange={(e) => setServiceReminders(e.target.checked)}
//         />
//         Service Reminders
//       </label>

//       <br /><br />

//       <label>
//         <input
//           type="checkbox"
//           checked={vehicleReady}
//           onChange={(e) => setVehicleReady(e.target.checked)}
//         />
//         Vehicle Ready Notifications
//       </label>

//       <br /><br />

//       <button onClick={handleSave}>Save Preferences</button>

//       {message && <p style={{ color: "green" }}>{message}</p>}
//     </div>
//     //</CustomerLayout>
//   );
// }

// export default CustomerNotificationPreferencePage;