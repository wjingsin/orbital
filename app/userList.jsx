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
import { updateUserStatus, subscribeToOnlineUsers } from '../firebaseService';
import useClerkFirebaseSync from '../hooks/useClerkFirebaseSync';
import InAppLayout from "../components/InAppLayout";
import { usePetData, PET_TYPES } from '../contexts/PetContext';
import Spacer from "../components/Spacer";
import Corgi from "../components/corgi_jumping";
import { SignOutButtonSmall } from "../components/SignOutButtonSmall";
import { useTokens } from "../contexts/TokenContext";
import Pom from "../components/pom_animated";
import Pug from "../components/pug_animated";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Background images
import background1 from '../assets/living room.png';
import background2 from '../assets/living room.png';
import background3 from '../assets/living room.png';

const backgroundImages = {
    '1': background1,
    '2': background2,
    '3': background3,
};

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
    const { points, addPoint } = useTokens();

    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [onlineCount, setOnlineCount] = useState(0);
    const [tokenRate, setTokenRate] = useState(1);
    const [earnedThisSession, setEarnedThisSession] = useState(0);
    const [backgroundData, setBackgroundData] = useState(null);

    // Animation values
    const tokenPulse = useRef(new Animated.Value(1)).current;
    const tokenEarnedAnim = useRef(new Animated.Value(0)).current;
    const tokenEarnedOpacity = useRef(new Animated.Value(0)).current;

    useClerkFirebaseSync();

    useEffect(() => {
        const loadBackground = async () => {
            try {
                const savedBackground = await AsyncStorage.getItem('selectedBackground');
                if (savedBackground) {
                    setBackgroundData(savedBackground);
                }
            } catch (error) {
                console.error('Failed to load background:', error);
            }
        };
        loadBackground();
    }, []);

    useEffect(() => {
        let intervalId;
        const newTokenRate = onlineCount + 1;
        setTokenRate(newTokenRate);

        intervalId = setInterval(() => {
            addPoint(newTokenRate);
            setEarnedThisSession(prev => prev + newTokenRate);
            pulseTokenIcon();
        }, 60000);

        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [onlineCount]);

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
        tokenEarnedAnim.setValue(0);
        tokenEarnedOpacity.setValue(1);
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
                await updateUserStatus(user.id, 'online');
                unsubscribeOnlineUsers = subscribeToOnlineUsers(user.id, (onlineUsers) => {
                    if (isActive) {
                        const otherUsers = onlineUsers.filter(u => u.userId !== user.id);
                        setUsers(otherUsers);
                        setOnlineCount(otherUsers.length);
                    }
                });
                setLoading(false);
            } catch (error) {
                console.error('Error initializing user:', error);
                setLoading(false);
                Alert.alert('Error', 'Failed to load user data. Please try again later.');
            }
        };

        initializeUser();

        return () => {
            isActive = false;
            if (unsubscribeOnlineUsers) unsubscribeOnlineUsers();
            if (user) updateUserStatus(user.id, 'offline');
        };
    }, [user]);

    const onRefresh = async () => {
        setRefreshing(true);
        setTimeout(() => setRefreshing(false), 1000);
    };

    const getPetComponent = (petType) => {
        switch (petType) {
            case 0: return Corgi;
            case 1: return Pom;
            case 2: return Pug;
            default: return Corgi;
        }
    };

    const DelayedPet = ({ delay, petType, style }) => {
        const [showPet, setShowPet] = useState(false);

        useEffect(() => {
            const timer = setTimeout(() => {
                setShowPet(true);
            }, delay);
            return () => clearTimeout(timer);
        }, [delay]);

        const PetComponent = getPetComponent(petType);

        if (!showPet) return null;

        return (
            <View style={style}>
                <PetComponent />
            </View>
        );
    };

    const PetDisplay = ({ petType, backgroundData, onlineUsers }) => {
        let backgroundImage = null;

        if (backgroundData) {
            try {
                const parsedData = typeof backgroundData === 'string'
                    ? JSON.parse(backgroundData)
                    : backgroundData;
                if (parsedData.imagePath && backgroundImages[parsedData.imagePath]) {
                    backgroundImage = backgroundImages[parsedData.imagePath];
                }
            } catch (error) {
                console.error('Error parsing background data:', error);
            }
        }

        const MainPetComponent = getPetComponent(petType);

        return (
            <View style={styles.petBackground}>
                {backgroundImage ? (
                    <ImageBackground
                        source={backgroundImage}
                        style={styles.backgroundImage}
                        resizeMode="cover"
                    >
                        {/* Main pet */}
                        <View style={styles.petAbsoluteFill}>
                            <MainPetComponent />
                        </View>

                        {/* Additional pets from online users */}
                        {onlineUsers.slice(0, 3).map((user, index) => {
                            const OnlinePetComponent = getPetComponent(user.petSelection);
                            return (
                                <DelayedPet
                                    key={user.userId}
                                    delay={500 * (index + 1)} // 500ms, 1000ms, 1500ms
                                    petType={user.petSelection}
                                    style={[
                                        styles.petAbsoluteFill,
                                        {

                                            left: `${(index * 5)}%`,
                                            top: `${(index * 5)}%`,
                                            zIndex: index + 1,
                                        }
                                    ]}
                                >
                                    <OnlinePetComponent />
                                </DelayedPet>
                            );
                        })}
                    </ImageBackground>
                ) : (
                    <View style={[styles.backgroundImage, { backgroundColor: '#f0f0f0' }]}>
                        <View style={styles.petAbsoluteFill}>
                            <MainPetComponent />
                        </View>
                        {onlineUsers.slice(0, 3).map((user, index) => {
                            const OnlinePetComponent = getPetComponent(user.petSelection);
                            return (
                                <DelayedPet
                                    key={user.userId}
                                    delay={500 * (index + 1)} // 500ms, 1000ms, 1500ms
                                    petType={user.petSelection}
                                    style={[
                                        styles.petAbsoluteFill,
                                        {
                                            left: `${(index * 5)}%`,
                                            top: `${(index * 5)}%`,
                                            zIndex: index + 1,
                                        }
                                    ]}
                                >
                                    <OnlinePetComponent />
                                </DelayedPet>
                            );
                        })}
                    </View>
                )}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Spacer height={60} />
            <InAppLayout>
                <View style={styles.headerContainer}>
                    <View style={styles.headerLeftSpace} />
                    <Text style={styles.headerText}>     Focus</Text>
                    <SignOutButtonSmall />
                    <Spacer width={20} />
                </View>

                <View style={styles.tokenContainer}>
                    <View style={styles.totalTokensContainer}>
                        <Animated.View style={{ transform: [{ scale: tokenPulse }] }}>
                            <MaterialCommunityIcons name="paw" size={24} color="#505a98" />
                        </Animated.View>
                        <Text style={styles.totalTokens}>{points}</Text>
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
                <View style={styles.petDisplayArea}>
                    <PetDisplay
                        petType={petData.selectedPet}
                        backgroundData={backgroundData}
                        onlineUsers={users}
                    />
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
                            // refreshControl={
                            //     <RefreshControl
                            //         refreshing={refreshing}
                            //         onRefresh={onRefresh}
                            //         colors={['#eb7d42']}
                            //     />
                            // }
                            // contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    )}
                </View>
                <Spacer height={10} />
            </InAppLayout>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8f8f8',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
    },
    headerLeftSpace: {
        width: 70,
    },
    headerText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        flex: 1,
        textAlign: 'center',
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
    petBackground: {
        width: '100%',
        height: 300,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: 20,
        marginBottom: 20,
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    petAbsoluteFill: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    petDisplayArea: {
        marginHorizontal: 15,
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
    onlineCount: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
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