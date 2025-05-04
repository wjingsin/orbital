// app/userConnection.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    RefreshControl,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

// Import Firebase services
import {
    subscribeToPendingInvitations,
    updateUserStatus,
    getActiveSession,
    subscribeToOnlineUsers,
    sendInvitation
} from '../firebaseService';
import useClerkFirebaseSync from '../hooks/useClerkFirebaseSync';
import InAppLayout from "../components/InAppLayout";

export default function UserConnectionScreen() {
    const { signOut } = useAuth();
    const { user } = useUser();
    const router = useRouter();

    const [pendingInvitations, setPendingInvitations] = useState(0);
    const [loading, setLoading] = useState(true);
    const [signingOut, setSigningOut] = useState(false);
    const [users, setUsers] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [invitingSent, setInvitingSent] = useState({});

    // Use the hook to ensure user data is synced with Firebase
    useClerkFirebaseSync();

    useEffect(() => {
        let unsubscribePendingInvitations;
        let unsubscribeOnlineUsers;
        let isActive = true;

        const initializeUser = async () => {
            if (!user) return;

            try {
                // Set user as online
                await updateUserStatus(user.id, 'online');

                // Check if user has an active session
                const activeSession = await getActiveSession(user.id);
                if (activeSession) {
                    // Redirect to the active session
                    Alert.alert(
                        'Active Session Found',
                        'You have an active session. Would you like to return to it?',
                        [
                            { text: 'No', style: 'cancel' },
                            {
                                text: 'Yes',
                                onPress: () => router.push({ pathname: '/session', params: { sessionId: activeSession.id } })
                            }
                        ]
                    );
                }

                // Subscribe to pending invitations
                unsubscribePendingInvitations = subscribeToPendingInvitations(user.id, (invitations) => {
                    if (isActive) {
                        setPendingInvitations(invitations.length);
                    }
                });

                // Subscribe to online users
                unsubscribeOnlineUsers = subscribeToOnlineUsers(user.id, (onlineUsers) => {
                    if (isActive) {
                        setUsers(onlineUsers);
                    }
                });

                if (isActive) {
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error initializing user:', error);
                if (isActive) {
                    // Set loading to false even on error to prevent infinite loading state
                    setLoading(false);
                    // Show error message to user
                    Alert.alert('Error', 'Failed to load user data. Please try again later.');
                }
            }
        };

        initializeUser();

        // Set user as offline when component unmounts
        return () => {
            isActive = false;
            if (unsubscribePendingInvitations) {
                unsubscribePendingInvitations();
            }
            if (unsubscribeOnlineUsers) {
                unsubscribeOnlineUsers();
            }
            if (user) {
                updateUserStatus(user.id, 'offline');
            }
        };
    }, [user]);

    const handleSignOut = async () => {
        if (signingOut) return;

        setSigningOut(true);
        try {
            if (user) {
                // Set user status to offline before signing out
                await updateUserStatus(user.id, 'offline');
            }
            await signOut();
            router.replace('/');
        } catch (error) {
            console.error('Error signing out:', error);
            Alert.alert('Error', 'Failed to sign out. Please try again.');
            setSigningOut(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        // The subscription will update the users list automatically
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    };

    const handleSendInvitation = async (toUserId) => {
        if (!user) return;

        setInvitingSent(prev => ({ ...prev, [toUserId]: true }));

        try {
            await sendInvitation(
                user.id,
                toUserId,
                `${user.firstName || 'Someone'} wants to connect with you!`,
                'chat'
            );
            // Success notification can be added here
        } catch (error) {
            console.error('Error sending invitation:', error);
            // Error handling can be added here
        } finally {
            setInvitingSent(prev => ({ ...prev, [toUserId]: false }));
        }
    };

    // Add a debug button to help troubleshoot
    const forceExit = () => {
        setLoading(false);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#eb7d42" />
                <Text style={styles.loadingText}>Loading...</Text>
                <TouchableOpacity style={styles.debugButton} onPress={forceExit}>
                    <Text style={styles.debugButtonText}>Debug: Force Exit Loading</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <InAppLayout>
            <View style={styles.header}>
                <Text style={styles.headerText}>Available Users</Text>
                <TouchableOpacity style={styles.iconButton} onPress={() => router.push('/invitations')}>
                    <Ionicons name="mail" size={24} color="#fff" />
                    {pendingInvitations > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{pendingInvitations}</Text>
                        </View>
                    )}
                </TouchableOpacity>
            </View>

            {users.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyText}>No users are currently online</Text>
                    <TouchableOpacity
                        style={styles.refreshButton}
                        onPress={onRefresh}
                    >
                        <Text style={styles.refreshButtonText}>Refresh</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.userId}
                    renderItem={({ item }) => (
                        <View style={styles.userCard}>
                            <View style={styles.userInfo}>
                                <Image
                                    source={{ uri: item.photoUrl || 'https://via.placeholder.com/50' }}
                                    style={styles.avatar}
                                />
                                <View>
                                    <Text style={styles.userName}>{item.displayName}</Text>
                                    <View style={styles.statusContainer}>
                                        <View style={[styles.statusIndicator, { backgroundColor: 'green' }]} />
                                        <Text style={styles.statusText}>Online</Text>
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={[
                                    styles.inviteButton,
                                    invitingSent[item.userId] && styles.inviteButtonDisabled
                                ]}
                                onPress={() => handleSendInvitation(item.userId)}
                                disabled={invitingSent[item.userId]}
                            >
                                {invitingSent[item.userId] ? (
                                    <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                    <Text style={styles.inviteButtonText}>Invite</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            colors={['#eb7d42']}
                        />
                    }
                    contentContainerStyle={{ paddingBottom: 80 }} // Add extra padding for the footer buttons
                />
            )}

            <View style={styles.footer}>
                <TouchableOpacity
                    style={styles.signOutButton}
                    onPress={handleSignOut}
                    disabled={signingOut}
                >
                    {signingOut ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="log-out-outline" size={20} color="#fff" style={styles.buttonIcon} />
                            <Text style={styles.signOutButtonText}>Sign Out</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
            < /InAppLayout>
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
        backgroundColor: '#f8f8f8',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    debugButton: {
        marginTop: 20,
        padding: 10,
        backgroundColor: '#ddd',
        borderRadius: 5,
    },
    debugButtonText: {
        color: '#333',
    },
    header: {
        backgroundColor: '#eb7d42',
        paddingTop: 50,
        paddingBottom: 15,
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
    },
    iconButton: {
        position: 'relative',
        padding: 8,
    },
    badge: {
        position: 'absolute',
        top: 0,
        right: 0,
        backgroundColor: '#f44336',
        borderRadius: 10,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badgeText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 16,
    },
    refreshButton: {
        backgroundColor: '#eb7d42',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
    },
    refreshButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    userCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        padding: 16,
        marginHorizontal: 16,
        marginTop: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 16,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    statusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 14,
        color: '#666',
    },
    inviteButton: {
        backgroundColor: '#eb7d42',
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        minWidth: 80,
        alignItems: 'center',
    },
    inviteButtonDisabled: {
        backgroundColor: '#ccc',
    },
    inviteButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    footer: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#f8f8f8',
    },
    signOutButton: {
        backgroundColor: '#f44336',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
    },
    signOutButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    buttonIcon: {
        marginRight: 8,
    },
});