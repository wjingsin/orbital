import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { getAllUsers, subscribeToUserStatusChanges } from '../firebaseService';
import InAppLayout from "../components/InAppLayout";
import Spacer from "../components/Spacer";
import { PET_TYPES } from "../contexts/PetContext";
import { useTokens } from '../contexts/TokenContext'; // <-- Add this
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Pet images
const PET_IMAGES = {
    corgi: require('../assets/corgi1.png'),
    pomeranian: require('../assets/pom1.png'),
    pug: require('../assets/pug1.png'),
};

export default function LeaderboardScreen() {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const router = useRouter();
    const { user } = useUser();
    const { points } = useTokens(); // <-- Add this

    // Sync tokens to Firestore whenever points change
    useEffect(() => {
        const syncTokens = async () => {
            if (user && typeof points === 'number') {
                try {
                    const userRef = doc(db, 'users', user.id);
                    await updateDoc(userRef, { tokens: points });
                } catch (e) {
                    console.error('Failed to sync tokens to Firestore:', e);
                }
            }
        };
        syncTokens();
    }, [user, points]);

    useEffect(() => {
        let unsubscribe;

        const fetchUsers = async () => {
            setLoading(true);
            setError(null);
            try {
                const allUsers = await getAllUsers();
                setUsers(sortUsers(allUsers, user));
                unsubscribe = subscribeToUserStatusChanges((updatedUsers) => {
                    setUsers(sortUsers(updatedUsers, user));
                });
            } catch (err) {
                setError('Failed to fetch users');
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [user]);

    const sortUsers = (usersArr, currentUser) => {
        if (!usersArr) return [];
        let foundMe = false;
        const usersWithTokens = usersArr.map(u => {
            const id = u.userId || u.id;
            if (currentUser && id === currentUser.id) foundMe = true;
            return {
                ...u,
                tokens: typeof u.tokens === 'number' ? u.tokens : 0,
                id,
            };
        });
        if (currentUser && !foundMe) {
            usersWithTokens.push({
                id: currentUser.id,
                userId: currentUser.id,
                displayName: `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || currentUser.username || 'Anonymous',
                petName: 'Pet',
                petSelection: 0,
                tokens: points || 0, // <-- Use context points here
            });
        }
        return usersWithTokens
            .filter(u => u.petSelection !== undefined)
            .sort((a, b) => b.tokens - a.tokens);
    };

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            const allUsers = await getAllUsers();
            setUsers(sortUsers(allUsers, user));
        } catch (err) {
            setError('Failed to refresh users');
        }
        setRefreshing(false);
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#eb7d42" />
                <Text style={styles.loadingText}>Loading...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={{ color: 'red' }}>{error}</Text>
            </View>
        );
    }

    if (!users.length) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>No users found.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Spacer height={60} />
            <InAppLayout>
                <Text style={styles.headerText}>Leaderboard</Text>
                <Spacer height={20} />
                <FlatList
                    data={users}
                    keyExtractor={item => item.id}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                    }
                    renderItem={({ item, index }) => {
                        const petType = PET_TYPES[item.petSelection] || 'corgi';
                        const petImg = PET_IMAGES[petType] || PET_IMAGES['corgi'];
                        const isCurrentUser = user && (item.userId === user.id || item.id === user.id);
                        return (
                            <TouchableOpacity
                                style={[
                                    styles.userCard,
                                    isCurrentUser && { borderColor: '#eb7d42', borderWidth: 2 }
                                ]}
                                onPress={() => router.push({ pathname: '/UserProfile', params: { userId: item.userId || item.id } })}
                            >
                                <View style={styles.rankCircle}>
                                    <Text style={styles.rankText}>{index + 1}</Text>
                                </View>
                                <Image
                                    source={petImg}
                                    style={styles.avatar}
                                />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.petName}>{item.petName || 'No Pet Name'}</Text>
                                    <Text style={styles.userName}>Owner: {item.displayName || 'Unknown'}</Text>
                                </View>
                                <View style={styles.tokenContainer}>
                                    <Text style={styles.tokenText}>{item.tokens}</Text>
                                    <Image
                                        source={require('../assets/corgi1.png')}
                                        style={styles.tokenIcon}
                                    />
                                </View>
                            </TouchableOpacity>
                        );
                    }}
                    contentContainerStyle={{ paddingBottom: 20 }}
                />
            </InAppLayout>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#f8f8f8' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 16, fontSize: 16, color: '#666' },
    headerText: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        marginHorizontal: 16,
        marginVertical: 6,
        padding: 14,
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 1,
    },
    rankCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#eb7d42',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    rankText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
    avatar: { width: 50, height: 50, borderRadius: 25, marginRight: 16 },
    petName: { fontSize: 18, fontWeight: '600', color: '#333' },
    userName: { fontSize: 13, color: '#666' },
    tokenContainer: { flexDirection: 'row', alignItems: 'center', marginLeft: 10 },
    tokenText: { fontWeight: 'bold', color: '#505a98', fontSize: 18, marginRight: 4 },
    tokenIcon: { width: 22, height: 22 },
});
