// // app/invitations.js
// import React, { useState, useEffect } from 'react';
// import {
//     View,
//     Text,
//     FlatList,
//     TouchableOpacity,
//     StyleSheet,
//     ActivityIndicator,
//     Alert
// } from 'react-native';
// import { useRouter } from 'expo-router';
// import { useUser } from '@clerk/clerk-expo';
// import {
//     subscribeToPendingInvitations,
//     updateInvitationStatus,
//     getUserProfile,
//     createSession
// } from '/Users/aussure/Documents/orbital/orbital/firebaseService';
// import { Ionicons } from '@expo/vector-icons';
//
// export default function InvitationsScreen() {
//     const { isLoaded, isSignedIn, user } = useUser();
//     const router = useRouter();
//     const [invitations, setInvitations] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [processingInvitation, setProcessingInvitation] = useState({});
//     const [senderProfiles, setSenderProfiles] = useState({});
//
//     useEffect(() => {
//         let unsubscribe;
//         if (isLoaded && isSignedIn && user) {
//             unsubscribe = subscribeToPendingInvitations(user.id, async (pendingInvitations) => {
//                 setInvitations(pendingInvitations);
//
//                 // Fetch sender profiles for each invitation
//                 const profiles = { ...senderProfiles };
//
//                 for (const invitation of pendingInvitations) {
//                     if (!profiles[invitation.fromUserId]) {
//                         try {
//                             const senderProfile = await getUserProfile(invitation.fromUserId);
//                             if (senderProfile) {
//                                 profiles[invitation.fromUserId] = senderProfile;
//                             }
//                         } catch (error) {
//                             console.error('Error fetching sender profile:', error);
//                         }
//                     }
//                 }
//
//                 setSenderProfiles(profiles);
//                 setLoading(false);
//             });
//         }
//
//         return () => {
//             if (unsubscribe) {
//                 unsubscribe();
//             }
//         };
//     }, [isLoaded, isSignedIn, user]);
//
//     const handleAcceptInvitation = async (invitation) => {
//         if (!isSignedIn || !user) return;
//
//         setProcessingInvitation(prev => ({ ...prev, [invitation.id]: 'accepting' }));
//
//         try {
//             // Update invitation status to accepted
//             await updateInvitationStatus(invitation.id, 'accepted');
//
//             // Create a new session with both users
//             const session = await createSession(
//                 invitation.id,
//                 [invitation.fromUserId, invitation.toUserId],
//                 invitation.type
//             );
//
//             // Navigate to the session screen with the session ID
//             router.push({
//                 pathname: '/session',
//                 params: { sessionId: session.id }
//             });
//         } catch (error) {
//             console.error('Error accepting invitation:', error);
//             Alert.alert('Error', 'Failed to accept invitation. Please try again.');
//             setProcessingInvitation(prev => ({ ...prev, [invitation.id]: null }));
//         }
//     };
//
//     const handleDeclineInvitation = async (invitationId) => {
//         if (!isSignedIn || !user) return;
//
//         setProcessingInvitation(prev => ({ ...prev, [invitationId]: 'declining' }));
//
//         try {
//             await updateInvitationStatus(invitationId, 'declined');
//             setProcessingInvitation(prev => ({ ...prev, [invitationId]: null }));
//         } catch (error) {
//             console.error('Error declining invitation:', error);
//             Alert.alert('Error', 'Failed to decline invitation. Please try again.');
//             setProcessingInvitation(prev => ({ ...prev, [invitationId]: null }));
//         }
//     };
//
//     if (!isLoaded) {
//         return (
//             <View style={styles.loadingContainer}>
//                 <ActivityIndicator size="large" color="#eb7d42" />
//                 <Text style={styles.loadingText}>Loading...</Text>
//             </View>
//         );
//     }
//
//     return (
//         <View style={styles.container}>
//             <Text style={styles.header}>Invitations</Text>
//
//             {loading ? (
//                 <View style={styles.loadingContainer}>
//                     <ActivityIndicator size="large" color="#eb7d42" />
//                     <Text style={styles.loadingText}>Loading invitations...</Text>
//                 </View>
//             ) : invitations.length === 0 ? (
//                 <View style={styles.emptyContainer}>
//                     <Ionicons name="mail-outline" size={60} color="#ccc" />
//                     <Text style={styles.emptyText}>No pending invitations</Text>
//                 </View>
//             ) : (
//                 <FlatList
//                     data={invitations}
//                     keyExtractor={(item) => item.id}
//                     renderItem={({ item }) => {
//                         const sender = senderProfiles[item.fromUserId] || {};
//                         const isProcessing = processingInvitation[item.id];
//
//                         return (
//                             <View style={styles.invitationCard}>
//                                 <View style={styles.invitationContent}>
//                                     <Text style={styles.invitationText}>
//                                         <Text style={styles.senderName}>{sender.displayName || 'Someone'}</Text> sent you an invitation
//                                     </Text>
//                                     <Text style={styles.invitationMessage}>{item.message}</Text>
//                                     <Text style={styles.invitationTime}>
//                                         {item.createdAt?.toDate ?
//                                             new Date(item.createdAt.toDate()).toLocaleTimeString() :
//                                             'Just now'}
//                                     </Text>
//                                 </View>
//
//                                 <View style={styles.actionButtons}>
//                                     <TouchableOpacity
//                                         style={[
//                                             styles.actionButton,
//                                             styles.declineButton,
//                                             isProcessing === 'declining' && styles.disabledButton
//                                         ]}
//                                         onPress={() => handleDeclineInvitation(item.id)}
//                                         disabled={isProcessing}
//                                     >
//                                         {isProcessing === 'declining' ? (
//                                             <ActivityIndicator size="small" color="#fff" />
//                                         ) : (
//                                             <Text style={styles.actionButtonText}>Decline</Text>
//                                         )}
//                                     </TouchableOpacity>
//
//                                     <TouchableOpacity
//                                         style={[
//                                             styles.actionButton,
//                                             styles.acceptButton,
//                                             isProcessing === 'accepting' && styles.disabledButton
//                                         ]}
//                                         onPress={() => handleAcceptInvitation(item)}
//                                         disabled={isProcessing}
//                                     >
//                                         {isProcessing === 'accepting' ? (
//                                             <ActivityIndicator size="small" color="#fff" />
//                                         ) : (
//                                             <Text style={styles.actionButtonText}>Accept</Text>
//                                         )}
//                                     </TouchableOpacity>
//                                 </View>
//                             </View>
//                         );
//                     }}
//                     contentContainerStyle={{ padding: 16 }}
//                 />
//             )}
//
//             <View style={styles.bottomContainer}>
//                 <TouchableOpacity
//                     style={styles.backButton}
//                     onPress={() => router.push('/userList')}
//                 >
//                     <Text style={styles.backButtonText}>Find Users</Text>
//                 </TouchableOpacity>
//
//                 <TouchableOpacity
//                     style={[styles.backButton, { backgroundColor: '#555' }]}
//                     onPress={() => router.push('/petSelection')}
//                 >
//                     <Text style={styles.backButtonText}>Home</Text>
//                 </TouchableOpacity>
//             </View>
//         </View>
//     );
// }
//
// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: '#f8f8f8',
//     },
//     header: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         marginTop: 50,
//         marginBottom: 20,
//         textAlign: 'center',
//         color: '#333',
//     },
//     loadingContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//     },
//     loadingText: {
//         marginTop: 16,
//         fontSize: 16,
//         color: '#666',
//     },
//     emptyContainer: {
//         flex: 1,
//         justifyContent: 'center',
//         alignItems: 'center',
//         paddingBottom: 100,
//     },
//     emptyText: {
//         marginTop: 16,
//         fontSize: 16,
//         color: '#999',
//     },
//     invitationCard: {
//         backgroundColor: '#fff',
//         borderRadius: 10,
//         marginBottom: 16,
//         shadowColor: '#000',
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         elevation: 2,
//         overflow: 'hidden',
//     },
//     invitationContent: {
//         padding: 16,
//     },
//     invitationText: {
//         fontSize: 16,
//         marginBottom: 6,
//         color: '#333',
//     },
//     senderName: {
//         fontWeight: 'bold',
//     },
//     invitationMessage: {
//         fontSize: 14,
//         color: '#666',
//         marginBottom: 8,
//     },
//     invitationTime: {
//         fontSize: 12,
//         color: '#999',
//     },
//     actionButtons: {
//         flexDirection: 'row',
//         borderTopWidth: 1,
//         borderTopColor: '#eee',
//     },
//     actionButton: {
//         flex: 1,
//         paddingVertical: 12,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     acceptButton: {
//         backgroundColor: '#eb7d42',
//     },
//     declineButton: {
//         backgroundColor: '#f44336',
//     },
//     disabledButton: {
//         opacity: 0.7,
//     },
//     actionButtonText: {
//         color: '#fff',
//         fontWeight: '600',
//     },
//     bottomContainer: {
//         flexDirection: 'row',
//         paddingHorizontal: 16,
//         paddingBottom: 20,
//     },
//     backButton: {
//         flex: 1,
//         backgroundColor: '#eb7d42',
//         paddingVertical: 14,
//         borderRadius: 8,
//         alignItems: 'center',
//         margin: 5,
//     },
//     backButtonText: {
//         color: '#fff',
//         fontSize: 16,
//         fontWeight: '600',
//     },
// });
// app/invitations.js
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import {
    subscribeToPendingInvitations,
    updateInvitationStatus,
    createSession
} from '../firebaseService';

export default function InvitationsScreen() {
    const { user } = useUser();
    const router = useRouter();
    const [invitations, setInvitations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processingInvitation, setProcessingInvitation] = useState({});

    useEffect(() => {
        let unsubscribe;

        if (user) {
            unsubscribe = subscribeToPendingInvitations(user.id, (pendingInvitations) => {
                setInvitations(pendingInvitations);
                setLoading(false);
            });
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

    const handleAcceptInvitation = async (invitation) => {
        if (!user) return;

        setProcessingInvitation(prev => ({ ...prev, [invitation.id]: 'accepting' }));

        try {
            // Update invitation status to accepted
            await updateInvitationStatus(invitation.id, 'accepted');

            // Create a new session with both users
            const session = await createSession(
                invitation.id,
                [invitation.fromUserId, invitation.toUserId],
                invitation.type
            );

            // Navigate to the session screen
            router.push({
                pathname: '/session',
                params: { sessionId: session.id }
            });
        } catch (error) {
            console.error('Error accepting invitation:', error);
            Alert.alert('Error', 'Failed to accept invitation');
            setProcessingInvitation(prev => ({ ...prev, [invitation.id]: null }));
        }
    };

    const handleDeclineInvitation = async (invitationId) => {
        if (!user) return;

        setProcessingInvitation(prev => ({ ...prev, [invitationId]: 'declining' }));

        try {
            await updateInvitationStatus(invitationId, 'declined');
            setProcessingInvitation(prev => ({ ...prev, [invitationId]: null }));
        } catch (error) {
            console.error('Error declining invitation:', error);
            Alert.alert('Error', 'Failed to decline invitation');
            setProcessingInvitation(prev => ({ ...prev, [invitationId]: null }));
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#eb7d42" />
                <Text style={styles.loadingText}>Loading invitations...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Invitations</Text>
            </View>

            {invitations.length === 0 ? (
                <View style={styles.emptyContainer}>
                    <Ionicons name="mail-outline" size={60} color="#ccc" />
                    <Text style={styles.emptyText}>No pending invitations</Text>
                </View>
            ) : (
                <FlatList
                    data={invitations}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => {
                        const isProcessing = processingInvitation[item.id];
                        return (
                            <View style={styles.invitationCard}>
                                <View style={styles.invitationContent}>
                                    <Text style={styles.invitationText}>
                                        You have received an invitation
                                    </Text>
                                    <Text style={styles.invitationMessage}>{item.message}</Text>
                                </View>

                                <View style={styles.actionButtons}>
                                    <TouchableOpacity
                                        style={[
                                            styles.actionButton,
                                            styles.declineButton,
                                            isProcessing === 'declining' && styles.disabledButton
                                        ]}
                                        onPress={() => handleDeclineInvitation(item.id)}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing === 'declining' ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.actionButtonText}>Decline</Text>
                                        )}
                                    </TouchableOpacity>

                                    <TouchableOpacity
                                        style={[
                                            styles.actionButton,
                                            styles.acceptButton,
                                            isProcessing === 'accepting' && styles.disabledButton
                                        ]}
                                        onPress={() => handleAcceptInvitation(item)}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing === 'accepting' ? (
                                            <ActivityIndicator size="small" color="#fff" />
                                        ) : (
                                            <Text style={styles.actionButtonText}>Accept</Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        );
                    }}
                    contentContainerStyle={{ padding: 16 }}
                />
            )}

            <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.push('/userList')}
            >
                <Text style={styles.backButtonText}>Back to Home</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    header: {
        backgroundColor: '#eb7d42',
        paddingTop: 50,
        paddingBottom: 15,
        alignItems: 'center',
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#fff',
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#999',
    },
    invitationCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        overflow: 'hidden',
    },
    invitationContent: {
        padding: 16,
    },
    invitationText: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 6,
        color: '#333',
    },
    invitationMessage: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    actionButtons: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    actionButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    acceptButton: {
        backgroundColor: '#eb7d42',
    },
    declineButton: {
        backgroundColor: '#f44336',
    },
    disabledButton: {
        opacity: 0.7,
    },
    actionButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    backButton: {
        backgroundColor: '#555',
        paddingVertical: 14,
        borderRadius: 8,
        alignItems: 'center',
        margin: 16,
    },
    backButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});