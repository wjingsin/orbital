import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    Text,
    View,
    ImageBackground,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import InAppLayout from "../components/InAppLayout";
import Corgi from "../components/corgi_walking";
import Pom from "../components/pom_walking";
import Pug from "../components/pug_walking";
import NoPetAnimated from "../components/nopet_animated";
import { FontAwesome5 } from '@expo/vector-icons';
import Spacer from "../components/Spacer";

// Import background images
import background1 from '../assets/living room.png';
import background2 from '../assets/wreck_it_ralph_880.0.1491200032.png';
import background3 from '../assets/starry_night.png';

// Map of background IDs to image sources
const backgroundImages = {
    '1': background1,
    '2': background2,
    '3': background3,
    // Add more as needed
};

const PetDisplay = ({ petType, backgroundData, hasPet }) => {
    // Get the background image from the ID
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

    // If user doesn't have a pet, show NoPetAnimated
    if (!hasPet) {
        return (
            <View style={styles.petBackground}>
                {backgroundImage ? (
                    <ImageBackground
                        source={backgroundImage}
                        style={styles.backgroundImage}
                        resizeMode="cover"
                    >
                        <NoPetAnimated />
                    </ImageBackground>
                ) : (
                    <View style={[styles.backgroundImage, { backgroundColor: '#f0f0f0' }]}>
                        <NoPetAnimated />
                    </View>
                )}
            </View>
        );
    }

    // Render pet with background image
    let PetComponent;
    switch (petType) {
        case 0: // Corgi
            PetComponent = Corgi;
            break;
        case 1: // Pomeranian
            PetComponent = Pom;
            break;
        case 2: // Pug
            PetComponent = Pug;
            break;
        default:
            PetComponent = Corgi;
    }

    return (
        <View style={styles.petBackground}>
            {backgroundImage ? (
                <ImageBackground
                    source={backgroundImage}
                    style={styles.backgroundImage}
                    resizeMode="cover"
                >
                    <PetComponent />
                </ImageBackground>
            ) : (
                // Default light gray background if no image
                <View style={[styles.backgroundImage, { backgroundColor: '#f0f0f0' }]}>
                    <PetComponent />
                </View>
            )}
        </View>
    );
};

export default function UserProfile() {
    const { userId } = useLocalSearchParams();
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [backgroundData, setBackgroundData] = useState(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (!userId) {
                setError('No user ID provided');
                setLoading(false);
                return;
            }

            try {
                const userRef = doc(db, 'users', userId);
                const userSnap = await getDoc(userRef);

                if (userSnap.exists()) {
                    setUserData(userSnap.data());

                    // Try to get background data if available
                    if (userSnap.data().backgroundData) {
                        setBackgroundData(userSnap.data().backgroundData);
                    }
                } else {
                    setError('User not found');
                }
            } catch (err) {
                console.error('Error fetching user data:', err);
                setError('Failed to load user profile');
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [userId]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#eb7d42" />
                <Text style={styles.loadingText}>Loading profile...</Text>
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

    if (!userData) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>No user data found.</Text>
            </View>
        );
    }

    return (
        <InAppLayout>
            <View style={styles.container}>
                <Spacer height={20}/>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <FontAwesome5 name="arrow-left" size={20} color="#555" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>User Profiles</Text>
                    <Spacer width={15}/>
                </View>
                <Spacer height={100}/>

                <View style={styles.petContainer}>
                    <View style={styles.petNameContainer}>
                        <Text style={styles.petName}>{userData.petName || 'Unnamed Pet'}</Text>

                        <View style={styles.tokenIndicator}>
                            <FontAwesome5 name="paw" size={16} color="#505a98" />
                            <Text style={styles.tokenText}>{userData.tokens || 0}</Text>
                        </View>
                    </View>

                    <View style={styles.petDisplayArea}>
                        <PetDisplay
                            petType={userData.petSelection || 0}
                            backgroundData={backgroundData}
                            hasPet={userData.hasPet !== undefined ? userData.hasPet : true}
                        />
                    </View>

                    <View style={styles.ownerContainer}>
                        <Text style={styles.ownerLabel}>Owner:</Text>
                        <Text style={styles.ownerName}>
                            {userData.displayName || 'Anonymous User'}
                        </Text>
                    </View>
                </View>
            </View>
        </InAppLayout>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingTop: 50,
        paddingHorizontal: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#343a40',
    },
    petContainer: {
        flex: 1,
        marginBottom: 20,
        backgroundColor: '#ffffff',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
        padding: 16,
        maxHeight: 500,
    },
    petNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    petName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    tokenIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f4fbff',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#b3e8ff',
    },
    tokenText: {
        marginLeft: 6,
        fontWeight: '600',
        color: '#505a98',
    },
    petDisplayArea: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
        flex: 1,
    },
    petBackground: {
        width: 369,
        height: 300,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderRadius: 20,
    },
    backgroundImage: {
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ownerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
        paddingTop: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    ownerLabel: {
        fontSize: 16,
        color: '#666',
        marginRight: 5,
    },
    ownerName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333',
    },
});
