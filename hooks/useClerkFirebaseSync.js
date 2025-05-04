// hooks/useClerkFirebaseSync.js
import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function useClerkFirebaseSync() {
    const { user, isLoaded, isSignedIn } = useUser();

    useEffect(() => {
        const syncUserToFirebase = async () => {
            if (isLoaded && isSignedIn && user) {
                const userRef = doc(db, 'users', user.id);

                // Sync basic user data to Firebase
                await setDoc(userRef, {
                    userId: user.id,
                    displayName: user.fullName || user.username || 'Anonymous',
                    email: user.primaryEmailAddress?.emailAddress,
                    photoUrl: user.imageUrl,
                    status: 'online',
                    lastActive: serverTimestamp(),
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }
        };

        syncUserToFirebase();
    }, [isLoaded, isSignedIn, user]);
}