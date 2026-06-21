import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db, secondaryAuth } from "./firebaseConfig";

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
  const userData = userDoc.data();

  // Step 3: Block login if the account has been deactivated.
  // Missing "active" field defaults to true, so existing accounts
  // created before this feature are unaffected.
  if (userData.active === false) {
    throw new Error("This account has been deactivated.");
  }

  return userData.role; // returns "admin" or "customer"
}

const DEFAULT_PASSWORD = "password";

export async function signUpCustomer({ firstName, lastName, email, phone }) {
  // Step 1: Create the Auth account on the secondary instance, so the
  // admin's own session (on the primary instance) is never affected
  let userCredential;
  try {
    userCredential = await createUserWithEmailAndPassword(
      secondaryAuth,
      email,
      DEFAULT_PASSWORD
    );
  } catch (err) {
    if (err.code === "auth/email-already-in-use") {
      throw new Error("This email already exists", { cause: err });
    }
    throw new Error("Something went wrong while creating the account.", { cause: err });
  }

  const uid = userCredential.user.uid;

  // Step 2: Write the matching Firestore profile document
  try {
    await setDoc(doc(db, "users", uid), {
      role: "customer",
      firstName,
      lastName,
      email,
      phone,
    });
  } finally {
    // Step 3: Always sign out of the secondary instance afterward,
    // regardless of whether the Firestore write succeeded
    await signOut(secondaryAuth);
  }

  return uid;
}