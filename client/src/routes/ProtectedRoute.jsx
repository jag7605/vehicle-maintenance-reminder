import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebaseConfig';

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
      const role = userDoc.data()?.role;
      setStatus(role === requiredRole ? 'authorized' : 'unauthorized');
    }); // <-- async callback ends here

    return () => unsubscribe(); // <-- cleanup sits here, inside useEffect but outside the callback
  }, [requiredRole]);

  if (status === 'loading') return <p>Loading...</p>;
  if (status === 'unauthorized') return <Navigate to="/" />;
  return children;
}

export default ProtectedRoute;