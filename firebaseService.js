import {
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    addDoc,
    updateDoc,
    onSnapshot,
    orderBy,
    serverTimestamp,
    limit
} from 'firebase/firestore';
import { db } from './firebaseConfig';

// User Management

export const getUserProfile = async (userId) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
            return { id: userSnap.id, ...userSnap.data() };
        } else {
            console.log('No such user!');
            return null;
        }
    } catch (error) {
        console.error('Error getting user profile:', error);
        throw error;
    }
};

export const updateUserStatus = async (userId, status) => {
    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            status,
            lastActive: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error updating user status:', error);
        throw error;
    }
};

export const getOnlineUsers = async (currentUserId) => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('status', '==', 'online'),
            where('userId', '!=', currentUserId)
        );
        const querySnapshot = await getDocs(q);
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        return users;
    } catch (error) {
        console.error('Error getting online users:', error);
        throw error;
    }
};

// NEW: Get all users (online and offline)
export const getAllUsers = async () => {
    try {
        const usersRef = collection(db, 'users');
        const querySnapshot = await getDocs(usersRef);
        const users = [];
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        return users;
    } catch (error) {
        console.error('Error getting all users:', error);
        throw error;
    }
};

// Real-time listener for online users
export const subscribeToOnlineUsers = (currentUserId, callback) => {
    try {
        const usersRef = collection(db, 'users');
        const q = query(
            usersRef,
            where('status', '==', 'online'),
            where('userId', '!=', currentUserId)
        );
        return onSnapshot(q, (snapshot) => {
            const users = [];
            snapshot.forEach((doc) => {
                users.push({ id: doc.id, ...doc.data() });
            });
            callback(users);
        });
    } catch (error) {
        console.error('Error subscribing to online users:', error);
        throw error;
    }
};

// NEW: Real-time listener for all users (online and offline)
export const subscribeToUserStatusChanges = (callback) => {
    try {
        const usersRef = collection(db, 'users');
        return onSnapshot(usersRef, (snapshot) => {
            const users = [];
            snapshot.forEach((doc) => {
                users.push({ id: doc.id, ...doc.data() });
            });
            callback(users);
        });
    } catch (error) {
        console.error('Error subscribing to user status changes:', error);
        throw error;
    }
};

// Invitation Management

export const sendInvitation = async (fromUserId, toUserId, message = '', type = 'chat') => {
    try {
        const invitationsRef = collection(db, 'invitations');
        const invitationData = {
            fromUserId,
            toUserId,
            message,
            type,
            status: 'pending',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        const docRef = await addDoc(invitationsRef, invitationData);
        return { id: docRef.id, ...invitationData };
    } catch (error) {
        console.error('Error sending invitation:', error);
        throw error;
    }
};

export const updateInvitationStatus = async (invitationId, status) => {
    try {
        const invitationRef = doc(db, 'invitations', invitationId);
        await updateDoc(invitationRef, {
            status,
            updatedAt: serverTimestamp()
        });
        return true;
    } catch (error) {
        console.error('Error updating invitation status:', error);
        throw error;
    }
};

export const getInvitationsForUser = async (userId, status = 'pending') => {
    try {
        const invitationsRef = collection(db, 'invitations');
        const q = query(
            invitationsRef,
            where('toUserId', '==', userId),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const invitations = [];
        querySnapshot.forEach((doc) => {
            invitations.push({ id: doc.id, ...doc.data() });
        });
        return invitations;
    } catch (error) {
        console.error('Error getting invitations:', error);
        throw error;
    }
};

// Real-time listener for pending invitations
export const subscribeToPendingInvitations = (userId, callback) => {
    try {
        const invitationsRef = collection(db, 'invitations');
        const q = query(
            invitationsRef,
            where('toUserId', '==', userId),
            where('status', '==', 'pending'),
            orderBy('createdAt', 'desc')
        );
        return onSnapshot(q, (snapshot) => {
            const invitations = [];
            snapshot.forEach((doc) => {
                invitations.push({ id: doc.id, ...doc.data() });
            });
            callback(invitations);
        });
    } catch (error) {
        console.error('Error subscribing to invitations:', error);
        throw error;
    }
};

// Session Management

export const createSession = async (invitationId, participants, type = 'chat') => {
    try {
        const sessionsRef = collection(db, 'sessions');
        const sessionData = {
            invitationId,
            participants,
            type,
            status: 'active',
            startedAt: serverTimestamp(),
            endedAt: null,
            endedBy: null
        };
        const docRef = await addDoc(sessionsRef, sessionData);
        return { id: docRef.id, ...sessionData };
    } catch (error) {
        console.error('Error creating session:', error);
        throw error;
    }
};

export const endSession = async (sessionId, userId) => {
    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        await updateDoc(sessionRef, {
            status: 'ended',
            endedAt: serverTimestamp(),
            endedBy: userId
        });
        return true;
    } catch (error) {
        console.error('Error ending session:', error);
        throw error;
    }
};

export const getActiveSession = async (userId) => {
    try {
        const sessionsRef = collection(db, 'sessions');
        const q = query(
            sessionsRef,
            where('participants', 'array-contains', userId),
            where('status', '==', 'active'),
            limit(1)
        );
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0];
            return { id: doc.id, ...doc.data() };
        }
        return null;
    } catch (error) {
        console.error('Error getting active session:', error);
        throw error;
    }
};

// Real-time listener for session changes
export const subscribeToSession = (sessionId, callback) => {
    try {
        const sessionRef = doc(db, 'sessions', sessionId);
        return onSnapshot(sessionRef, (doc) => {
            if (doc.exists()) {
                callback({ id: doc.id, ...doc.data() });
            } else {
                callback(null);
            }
        });
    } catch (error) {
        console.error('Error subscribing to session:', error);
        throw error;
    }
};
