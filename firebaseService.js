// firebaseService.js
import { db } from './firebaseConfig';
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    onSnapshot,
    serverTimestamp
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Update user status (online/offline)
export const updateUserStatus = async (userId, status) => {
    try {
        const userRef = doc(db, 'users', userId);

        await updateDoc(userRef, {
            status: status,
            lastActive: serverTimestamp()
        });

        return true;
    } catch (error) {
        console.error('Error updating user status:', error);
        throw error;
    }
};

// Subscribe to online users
export const subscribeToOnlineUsers = (currentUserId, callback) => {
    // Reference to users collection
    const usersRef = collection(db, 'users');

    // Query for online users
    const onlineUsersQuery = query(usersRef, where('status', '==', 'online'));

    const unsubscribe = onSnapshot(onlineUsersQuery, (snapshot) => {
        const onlineUsers = [];

        snapshot.forEach(doc => {
            const userData = doc.data();
            // We'll collect all users including current user,
            // but filter in the component
            onlineUsers.push({
                userId: doc.id,
                displayName: userData.displayName || 'Anonymous',
                photoUrl: userData.photoUrl,
                status: userData.status,
                petName: userData.petName || 'Pet',
                petSelection: userData.petSelection || 0
            });
        });

        callback(onlineUsers);
    }, error => {
        console.error('Error getting online users:', error);
    });

    return unsubscribe;
};

// This function is needed to sync Clerk user data with Firebase
// Can be called directly if needed outside the hook
export const syncUserWithFirebase = async (user, petData) => {
    if (!user) return null;

    try {
        const userRef = doc(db, 'users', user.id);
        const userDoc = await getDoc(userRef);

        // If petData is not provided, try to get from AsyncStorage
        let finalPetData = petData;
        if (!finalPetData) {
            try {
                const petDataString = await AsyncStorage.getItem('petData');
                if (petDataString) {
                    finalPetData = JSON.parse(petDataString);
                }
            } catch (error) {
                console.error('Error reading pet data from AsyncStorage:', error);
                finalPetData = { selectedPet: 0, petName: 'Pet' };
            }
        }

        // Default pet data if not available
        const petSelection = finalPetData?.selectedPet || 0;
        const petName = finalPetData?.petName || 'Pet';

        const userData = {
            displayName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || 'Anonymous',
            email: user.primaryEmailAddress?.emailAddress,
            photoUrl: user.imageUrl,
            lastActive: serverTimestamp(),
            updatedAt: serverTimestamp(),
            // Add pet data
            petName: petName,
            petSelection: petSelection
        };

        if (!userDoc.exists()) {
            // Create new user
            userData.status = 'offline';
            userData.createdAt = serverTimestamp();
        }

        await setDoc(userRef, userData, { merge: true });

        return userRef;
    } catch (error) {
        console.error('Error syncing user with Firebase:', error);
        throw error;
    }
};