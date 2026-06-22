import { getAuth, signOut } from "firebase/auth";

const auth = getAuth();

function logout() {
    signOut(auth).then(() => {
        console.log("User signed out successfully.");
    }).catch((error) => {
        console.log("Error signing out:", error);
    });
}

export default logout;
