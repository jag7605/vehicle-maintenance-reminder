import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';
import './ProtectedRoute.css';

function ProtectedRoute({ children, requiredRole }) {
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setStatus('unauthorized');
        return;
      }
      // These lines must sit INSIDE the async callback, not after it
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.data();
      const role = userData?.role;

      // Missing "active" field defaults to true, matching the same
      // default used in auth.js and the admin customer pages
      const isActive = userData?.active !== false;

      if (!isActive) {
        // Sign out immediately so a deactivated user's session can't
        // keep granting access on subsequent page loads
        await signOut(auth);
        setStatus('unauthorized');
        return;
      }

      setStatus(role === requiredRole ? 'authorized' : 'unauthorized');
    }); // <-- async callback ends here

    return () => unsubscribe(); // <-- cleanup sits here, inside useEffect but outside the callback
  }, [requiredRole]);

  if (status === 'loading') return <p className="route-loading-text">Loading...</p>;
  if (status === 'unauthorized') return <Navigate to="/" />;
  return children;
}

export default ProtectedRoute;