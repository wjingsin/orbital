import { useEffect } from 'react';
import { useUser } from '@clerk/clerk-expo';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { usePetData } from '../contexts/PetContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function useClerkFirebaseSync() {
    const { user, isLoaded, isSignedIn } = useUser();
    const petContext = usePetData(); // Store the whole context to safely check

    useEffect(() => {
        const syncUserToFirebase = async () => {
            if (isLoaded && isSignedIn && user) {
                const userRef = doc(db, 'users', user.id);

                // Get pet data from context
                let petSelection = 0;
                let petName = 'Pet';

                // Use petData from context if available and valid
                if (petContext && petContext.petData && petContext.petData.isConfirmed) {
                    petSelection = petContext.petData.selectedPet;
                    petName = petContext.petData.petName;
                } else {
                    // Fall back to AsyncStorage if context is not yet populated
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

                // Sync user data with pet information to Firebase
                await setDoc(userRef, {
                    userId: user.id,
                    displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Anonymous',
                    email: user.primaryEmailAddress?.emailAddress,
                    photoUrl: user.imageUrl,
                    status: 'online',
                    lastActive: serverTimestamp(),
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    // Add pet data
                    petSelection: petSelection,
                    petName: petName
                }, { merge: true });
            }
        };

        syncUserToFirebase();
    }, [isLoaded, isSignedIn, user, petContext]); // Add petContext to dependency array
}