import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { usePetData } from '../contexts/PetContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function useClerkFirebaseSync() {
    const { user, isLoaded, isSignedIn } = useUser();
    const petContext = usePetData();

    useEffect(() => {
        const syncUserToFirebase = async () => {
            if (isLoaded && isSignedIn && user) {
                const userRef = doc(db, 'users', user.id);

                // Get pet data from context
                let petSelection = 0;
                let petName = 'Pet';

                if (petContext && petContext.petData && petContext.petData.isConfirmed) {
                    petSelection = petContext.petData.selectedPet;
                    petName = petContext.petData.petName;
                } else {
                    try {
                        const storedPetData = await AsyncStorage.getItem('petData');
                        if (storedPetData) {
                            const parsedPetData = JSON.parse(storedPetData);
                            petSelection = parsedPetData.selectedPet || 0;
                            petName = parsedPetData.petName || 'Pet';
                        }
                    } catch (error) {
                        console.error('Error reading pet data from AsyncStorage:', error);
                    }
                }

                // Check if user doc exists
                const userSnap = await getDoc(userRef);
                const isNewUser = !userSnap.exists();

                // Prepare data to update
                const data = {
                    userId: user.id,
                    displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Anonymous',
                    email: user.primaryEmailAddress?.emailAddress,
                    photoUrl: user.imageUrl,
                    status: 'online',
                    lastActive: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    petSelection,
                    petName,
                };

                // Only set createdAt and tokens if new user
                if (isNewUser) {
                    data.createdAt = serverTimestamp();
                    data.tokens = 0;
                }

                await setDoc(userRef, data, { merge: true });
            }
        };

        syncUserToFirebase();
    }, [isLoaded, isSignedIn, user, petContext]);
}
