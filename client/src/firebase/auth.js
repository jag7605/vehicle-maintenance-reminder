import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebaseConfig";
export async function loginUser(email, password) {
  // Step 1: Sign in with Firebase Authentication
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  const user = userCredential.user;
  // Step 2: Look up their role in Firestore
  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) {
    throw new Error("User account not configured correctly.");
  }
  const role = userDoc.data().role;
  return role; // returns "staff" or "customer"
}
