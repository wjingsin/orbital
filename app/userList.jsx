// app/userConnection.js
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    RefreshControl,
    Alert,
    Animated,
    ImageBackground
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { FontAwesome5, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

// Import Firebase services
import {
    updateUserStatus,
    subscribeToOnlineUsers
} from '../firebaseService';
import useClerkFirebaseSync from '../hooks/useClerkFirebaseSync';
import InAppLayout from "../components/InAppLayout";
import { usePetData, PET_TYPES } from '../contexts/PetContext';
import Spacer from "../components/Spacer";
import Corgi from "../components/corgi_jumping";
import Pom from "../components/pom_animated";
import Pug from "../components/pug_animated";
import { SignOutButtonSmall } from "../components/SignOutButtonSmall";
import { useTokens } from "../contexts/TokenContext";

// Pet images (same as in pet-selection.js)
const PET_IMAGES = {
    corgi: require('../assets/corgi1.png'),
    pomeranian: require('../assets/pom1.png'),
    pug: require('../assets/pug1.png'),
};

// Component to display layered pets with animation
const PetLayerDisplay = ({ users, currentUser }) => {
    const [visiblePets, setVisiblePets] = useState([]);
    const { petData } = usePetData();

    // Reset and update when users list changes
    useEffect(() => {
        // Create a new array with unique users
        const uniqueUsersMap = new Map();

        // First add current user's pet
        uniqueUsersMap.set(currentUser.id, {
            userId: currentUser.id,
            petSelection: petData.selectedPet,
            petName: petData.petName,
            isCurrentUser: true
        });

        // Add other users, ensuring no duplicates
        users.forEach(user => {
            // Only add if not already in the map
            if (!uniqueUsersMap.has(user.userId)) {
                uniqueUsersMap.set(user.userId, { ...user, isCurrentUser: false });
            }
        });

        // Convert Map to array
        const uniqueUsers = Array.from(uniqueUsersMap.values());
        setVisiblePets(uniqueUsers);
    }, [users, currentUser, petData]);

    // Render the correct pet component based on selection
    const getPetComponent = (petType) => {
        switch (petType) {
            case 0: return Corgi;
            case 1: return Pom;
            case 2: return Pug;
            default: return Corgi;
        }
    };

    return (
        <ImageBackground
            source={require('../assets/living room.png')}
            style={styles.backgroundImage}
            resizeMode="cover"
        >
            <View style={styles.petLayerContainer}>
                {visiblePets.map((pet, index) => {
                    const PetComponent = getPetComponent(pet.petSelection);

                    // Calculate offsets - slight horizontal and vertical variations
                    const horizontalOffset = index * 40; // 15 pixels right for each pet
                    const verticalOffset = index * 30;    // 5 pixels up for each pet

                    return (
                        <View
                            key={pet.userId}
                            style={[
                                styles.petLayer,
                                {
                                    bottom: 10 - verticalOffset,
                                    left: 20 + horizontalOffset,
                                }
                            ]}
                        >
                            <PetComponent />
                        </View>
                    );
                })}
            </View>
        </ImageBackground>
    );
};
export default function UserConnectionScreen() {
    const { signOut } = useAuth();
    const { user } = useUser();
    const router = useRouter();
    const { petData } = usePetData();
    const { points, addPoint } = useTokens();

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [onlineCount, setOnlineCount] = useState(0);
    const [tokenRate, setTokenRate] = useState(1);
    const [earnedThisSession, setEarnedThisSession] = useState(0);

    // Animation values
    const tokenPulse = useRef(new Animated.Value(1)).current;
    const tokenEarnedAnim = useRef(new Animated.Value(0)).current;
    const tokenEarnedOpacity = useRef(new Animated.Value(0)).current;

    // Use the hook to ensure user data is synced with Firebase
    useClerkFirebaseSync();

    // Handle token earning
    useEffect(() => {
        let intervalId;
        let tokensToAdd = 0;

        // Calculate token rate (1 + number of online users)
        const newTokenRate = onlineCount + 1;
        setTokenRate(newTokenRate);

        // Set up interval to add tokens
        intervalId = setInterval(() => {
            // Add points and update session count
            addPoint(newTokenRate);
            setEarnedThisSession(prev => prev + newTokenRate);

            // Trigger animation
            pulseTokenIcon();
            showEarnedAnimation(newTokenRate);
        }, 1000);

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [onlineCount]);

    // Animation functions
    const pulseTokenIcon = () => {
        Animated.sequence([
            Animated.timing(tokenPulse, {
                toValue: 1.2,
                duration: 200,
                useNativeDriver: true
            }),
            Animated.timing(tokenPulse, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true
            })
        ]).start();
    };

    const showEarnedAnimation = (amount) => {
        // Reset position
        tokenEarnedAnim.setValue(0);
        tokenEarnedOpacity.setValue(1);

        // Animate floating up and fading
        Animated.parallel([
            Animated.timing(tokenEarnedAnim, {
                toValue: -50,
                duration: 1000,
                useNativeDriver: true
            }),
            Animated.timing(tokenEarnedOpacity, {
                toValue: 0,
                duration: 1000,
                useNativeDriver: true
            })
        ]).start();
    };

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

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#eb7d42" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

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

                {/* Token Display */}
                <View style={styles.tokenContainer}>
                    <View style={styles.totalTokensContainer}>
                        <Animated.View style={{ transform: [{ scale: tokenPulse }] }}>
                            <MaterialCommunityIcons name="paw" size={24} color="#505a98" />
                        </Animated.View>
                        <Text style={styles.totalTokens}>{points}</Text>

                        {/* Animated earned tokens */}
                        <Animated.Text
                            style={[
                                styles.earnedTokens,
                                {
                                    opacity: tokenEarnedOpacity,
                                    transform: [{ translateY: tokenEarnedAnim }]
                                }
                            ]}
                        >
                            +{tokenRate}
                        </Animated.Text>
                    </View>

                    <View style={styles.tokenRateContainer}>
                        <Text style={styles.tokenRateText}>
                            {tokenRate} <MaterialCommunityIcons name="paw" size={14} color="#505a98" /> / min
                        </Text>
                        <Text style={styles.tokenBoostText}>
                            {onlineCount > 0 ? `+${onlineCount*100}% boost from other pets!` : 'No boost'}
                        </Text>
                    </View>

                    <View style={styles.sessionStatsContainer}>
                        <Text style={styles.sessionStatsText}>
                            Earned this visit: {earnedThisSession}
                        </Text>
                    </View>
                </View>

                <Spacer height={10} />

                {/* Pet Display Area - Replace Corgi with layered pets */}
                <View style={styles.petDisplayArea}>
                    {user && <PetLayerDisplay users={users} currentUser={user} />}
                </View>

                <Spacer height={20} />

                <View style={styles.listContainer}>
                    <View style={styles.listHeaderContainer}>
                        <Text style={styles.listHeaderText}>List of users</Text>
                        <Text style={styles.onlineCount}>{onlineCount} online</Text>
                    </View>

                    {users.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No pets are currently online</Text>
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
    // Existing styles...
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

    // New styles for pet display
    petDisplayArea: {
        width: 405,
        height: 300,
        borderRadius: 15,
        overflow: 'hidden',
        position: 'relative',
        marginHorizontal: 15,
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
    },
    petLayerContainer: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    petLayer: {
        position: 'absolute',
        alignItems: 'center',
    },

    // Rest of the existing styles
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
    tokenContainer: {
        backgroundColor: '#fafcff',
        borderRadius: 15,
        padding: 15,
        marginHorizontal: 15,
        marginBottom: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    totalTokensContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    totalTokens: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        marginLeft: 8,
    },
    earnedTokens: {
        position: 'absolute',
        right: -20,
        color: '#505a98',
        fontWeight: 'bold',
        fontSize: 16,
    },
    tokenRateContainer: {
        alignItems: 'center',
        marginTop: 5,
    },
    tokenRateText: {
        fontSize: 16,
        color: '#555',
        fontWeight: '600',
    },
    tokenBoostText: {
        fontSize: 12,
        color: '#676767',
        marginTop: 2,
        fontWeight: '500',
    },
    sessionStatsContainer: {
        alignItems: 'center',
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#eaeaea',
    },
    sessionStatsText: {
        fontSize: 12,
        color: '#888',
    },
});