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
import {Link, useRouter} from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import {FontAwesome5, Ionicons} from '@expo/vector-icons';

// Import Firebase services
import {
    updateUserStatus,
    subscribeToOnlineUsers
} from '../firebaseService';
import useClerkFirebaseSync from '../hooks/useClerkFirebaseSync';
import InAppLayout from "../components/InAppLayout";
import { usePetData, PET_TYPES } from '../contexts/PetContext';
import Spacer from "../components/Spacer";
import Corgi from "../components/corgi_animated";
import {SignOutButtonSmall} from "../components/SignOutButtonSmall";

// Pet images (same as in pet-selection.js)
const PET_IMAGES = {
    corgi: require('../assets/corgi1.png'),
    pomeranian: require('../assets/pom1.png'),
    pug: require('../assets/pug1.png'),
};

export default function UserConnectionScreen() {
    const { signOut } = useAuth();
    const { user } = useUser();
    const router = useRouter();
    const { petData } = usePetData();

    const [loading, setLoading] = useState(true);
    const [signingOut, setSigningOut] = useState(false);
    const [users, setUsers] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [onlineCount, setOnlineCount] = useState(0);
    // Use the hook to ensure user data is synced with Firebase
    useClerkFirebaseSync();

    useEffect(() => {
        let unsubscribeOnlineUsers;
        let isActive = true;

        const initializeUser = async () => {
            if (!user) return;

            try {
                // Set user as online
                await updateUserStatus(user.id, 'online');

                // Subscribe to online users
                unsubscribeOnlineUsers = subscribeToOnlineUsers(user.id, (onlineUsers) => {
                    if (isActive) {
                        // Filter out current user
                        const otherUsers = onlineUsers.filter(u => u.userId !== user.id);
                        setUsers(otherUsers);
                        setOnlineCount(otherUsers.length);
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
            if (unsubscribeOnlineUsers) {
                unsubscribeOnlineUsers();
            }
            if (user) {
                updateUserStatus(user.id, 'offline');
            }
        };
    }, [user]);

    const onRefresh = async () => {
        setRefreshing(true);
        // The subscription will update the users list automatically
        setTimeout(() => {
            setRefreshing(false);
        }, 1000);
    };

    // Function to get the appropriate image based on online count
    const getCountImage = () => {
        if (onlineCount === 1) {
            return require('../assets/pom1.png'); // Replace with your actual one user image
        } else if (onlineCount === 2) {
            return require('../assets/pom1.png'); // Replace with your actual two users image
        } else {
            return require('../assets/corgi1.png'); // Replace with your actual many users image
        }
    };

    // Add a debug button to help troubleshoot
    const forceExit = () => {
        setLoading(false);
    };
    //
    // if (loading) {
    //     return (
    //         <View style={styles.loadingContainer}>
    //             <ActivityIndicator size="large" color="#eb7d42" />
    //             <Text style={styles.loadingText}>Loading...</Text>
    //             <TouchableOpacity style={styles.debugButton} onPress={forceExit}>
    //                 <Text style={styles.debugButtonText}>Debug: Force Exit Loading</Text>
    //             </TouchableOpacity>
    //         </View>
    //     );
    // }

    return (
        <View style={styles.container}>
            <Spacer height={60} />
            <InAppLayout>
                <View style={styles.headerContainer}>
                    <View style={styles.headerLeftSpace} />
                    <Text style={styles.headerText}>    Playground</Text>
                    <SignOutButtonSmall />
                    <Spacer width={20} />

                </View>
                {/*<Image*/}
                {/*    source={getCountImage()}*/}
                {/*    style={styles.countImage}*/}
                {/*    resizeMode="contain"*/}
                {/*/>*/}
                <Spacer height={10} />
                <Corgi />
                <Spacer height={20} />

                <View style={styles.listContainer}>
                    <View style={styles.listHeaderContainer}>
                        <Text style={styles.listHeaderText}>List of users</Text>
                        <Text style={styles.onlineCount}>{onlineCount} online</Text>
                    </View>

                    {users.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No pets are currently online</Text>
                            {/*<TouchableOpacity*/}
                            {/*    style={styles.refreshButton}*/}
                            {/*    onPress={onRefresh}*/}
                            {/*>*/}
                            {/*    <Text style={styles.refreshButtonText}>Refresh</Text>*/}
                            {/*</TouchableOpacity>*/}
                        </View>
                    ) : (
                        <FlatList
                            data={users}
                            keyExtractor={(item) => item.userId}
                            renderItem={({ item }) => (
                                <View style={styles.userCard}>
                                    <View style={styles.userInfo}>
                                        <Image
                                            source={PET_IMAGES[PET_TYPES[item.petSelection]]}
                                            style={styles.avatar}
                                        />
                                        <View>
                                            <Text style={styles.petName}>{item.petName}</Text>
                                            <Text style={styles.userName}>
                                                Owner: {item.displayName}
                                            </Text>
                                            <View style={styles.statusContainer}>
                                                <View style={[styles.statusIndicator, { backgroundColor: 'green' }]} />
                                                <Text style={styles.statusText}>Online</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            )}
                            refreshControl={
                                <RefreshControl
                                    refreshing={refreshing}
                                    onRefresh={onRefresh}
                                    colors={['#eb7d42']}
                                />
                            }
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    )}
                </View>
                <Spacer height={10} />
            </InAppLayout>
        </View>
    );
}

const styles = StyleSheet.create({
    secondaryButton: {
        backgroundColor: 'transparent',
        padding: 8,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#eb7d42',
        alignItems: 'center',
        marginRight: 25,
        },

    secondaryButtonText: {
        color: '#eb7d42',
        fontSize: 12,
        fontWeight: '700',
        },
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
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    headerLeftSpace: {
        // This creates an empty space on the left to balance the points indicator
        width: 70, // Adjust based on your points indicator width
    },
    headerSpacer: {
        width: 80,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
    },
    onlineCount: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    countImage: {
        width: '100%',
        height: 200,
        marginBottom: 20,
    },
    listContainer: {
        flex: 1,
        backgroundColor: '#fff',
        marginHorizontal: 16,
        borderRadius: 10,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    listHeaderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#f0f0f0',
        borderBottomWidth: 1,
        borderColor: '#e0e0e0',
    },
    listHeaderText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
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
        padding: 16,
        marginHorizontal: 0,
        marginTop: 0,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 16,
    },
    userName: {
        fontSize: 14,
        color: '#666',
    },
    petName: {
        fontSize: 18,
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
});