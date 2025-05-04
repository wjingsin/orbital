// app/session.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    BackHandler
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import {
    subscribeToSession,
    endSession,
    getUserProfile
} from '/Users/aussure/Documents/orbital/orbital/firebaseService';
import { Ionicons } from '@expo/vector-icons';

export default function SessionScreen() {
    const { user } = useUser();
    const router = useRouter();
    const { sessionId } = useLocalSearchParams();

    const [session, setSession] = useState(null);
    const [otherUser, setOtherUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exiting, setExiting] = useState(false);

    useEffect(() => {
        if (!sessionId || !user) {
            router.replace('/petSelection');
            return;
        }

        // Subscribe to session changes
        const unsubscribe = subscribeToSession(sessionId, async (sessionData) => {
            if (!sessionData) {
                Alert.alert(
                    'Session Ended',
                    'This session no longer exists.',
                    [{ text: 'OK', onPress: () => router.replace('/petSelection') }]
                );
                return;
            }

            setSession(sessionData);

            // If session is ended, navigate back
            if (sessionData.status === 'ended') {
                // Check if current user ended the session to avoid duplicate alerts
                if (sessionData.endedBy !== user.id) {
                    Alert.alert(
                        'Session Ended',
                        'The other user has left the session.',
                        [{ text: 'OK', onPress: () => router.replace('/petSelection') }]
                    );
                } else {
                    router.replace('/petSelection');
                }
                return;
            }

            // Find the other user in the session
            const otherUserId = sessionData.participants.find(id => id !== user.id);
            if (otherUserId) {
                try {
                    const otherUserProfile = await getUserProfile(otherUserId);
                    setOtherUser(otherUserProfile);
                } catch (error) {
                    console.error('Error fetching other user profile:', error);
                }
            }

            setLoading(false);
        });

        // Handle back button press
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            handleExit();
            return true; // Prevent default back action
        });

        // Clean up subscriptions
        return () => {
            unsubscribe && unsubscribe();
            backHandler.remove();
        };
    }, [sessionId, user, router]);

    const handleExit = async () => {
        Alert.alert(
            'Exit Session',
            'Are you sure you want to leave this session?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Leave',
                    style: 'destructive',
                    onPress: async () => {
                        if (exiting) return;

                        setExiting(true);
                        try {
                            await endSession(sessionId, user.id);
                            router.replace('/petSelection');
                        } catch (error) {
                            console.error('Error ending session:', error);
                            Alert.alert('Error', 'Failed to exit the session. Please try again.');
                            setExiting(false);
                        }
                    }
                }
            ]
        );
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#eb7d42" />
                <Text style={styles.loadingText}>Loading session...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Active Session</Text>
                {otherUser && (
                    <Text style={styles.subHeaderText}>
                        With {otherUser.displayName || 'User'}
                    </Text>
                )}
            </View>

            <View style={styles.content}>
                <View style={styles.connectionIndicator}>
                    <Ionicons name="checkmark-circle" size={60} color="#4CAF50" />
                    <Text style={styles.connectionText}>Connected</Text>
                </View>

                <View style={styles.userCard}>
                    <Text style={styles.cardTitle}>You are now connected with:</Text>
                    {otherUser ? (
                        <View style={styles.userInfo}>
                            <View style={styles.avatarContainer}>
                                <Ionicons name="person-circle-outline" size={80} color="#eb7d42" />
                            </View>
                            <Text style={styles.userName}>{otherUser.displayName || 'User'}</Text>
                            <Text style={styles.userEmail}>{otherUser.email || ''}</Text>
                        </View>
                    ) : (
                        <Text style={styles.loadingUsers}>Loading user information...</Text>
                    )}
                </View>

                {/* This is where you would add your main session functionality */}
                <View style={styles.sessionContent}>
                    <Text style={styles.sessionMessage}>
                        You're now in a private session. This is where your main interaction would take place.
                    </Text>
                </View>
            </View>

            <TouchableOpacity
                style={[styles.exitButton, exiting && styles.exitButtonDisabled]}
                onPress={handleExit}
                disabled={exiting}
            >
                {exiting ? (
                    <ActivityIndicator size="small" color="#fff" />
                ) : (
                    <>
                        <Ionicons name="exit-outline" size={20} color="#fff" style={styles.exitIcon} />
                        <Text style={styles.exitButtonText}>Exit Session</Text>
                    </>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    header: {
        backgroundColor: '#eb7d42',
        paddingTop: 50,
        paddingBottom: 20,
        alignItems: 'center',
    },
    headerText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#fff',
    },
    subHeaderText: {
        fontSize: 16,
        color: '#fff',
        marginTop: 4,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    connectionIndicator: {
        alignItems: 'center',
        marginVertical: 20,
    },
    connectionText: {
        fontSize: 18,
        fontWeight: '500',
        color: '#4CAF50',
        marginTop: 8,
    },
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 16,
        textAlign: 'center',
    },
    userInfo: {
        alignItems: 'center',
    },
    avatarContainer: {
        marginBottom: 12,
    },
    userName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666',
    },
    loadingUsers: {
        textAlign: 'center',
        color: '#999',
        fontStyle: 'italic',
    },
    sessionContent: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        flex: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    sessionMessage: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
    },
    exitButton: {
        backgroundColor: '#f44336',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        marginHorizontal: 20,
        marginBottom: 20,
        borderRadius: 8,
    },
    exitButtonDisabled: {
        backgroundColor: '#ccc',
    },
    exitIcon: {
        marginRight: 8,
    },
    exitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});