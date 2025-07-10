import { StyleSheet, Text, View, TouchableOpacity, ImageBackground } from 'react-native'
import React, { useState, useEffect, useRef } from 'react'
import {FontAwesome5, Entypo, FontAwesome, AntDesign} from '@expo/vector-icons'
import { PointsProvider, usePoints } from "../contexts/PointsContext"


import Corgi from "../components/corgi_walking"
import CorgiJump from "../components/corgi_jumping"
import CorgiSniff from "../components/corgi_sniffwalk"
import Pom from "../components/pom_walking"
import PomJump from "../components/pom_walking"
import PomSniff from "../components/pom_sniffwalk"
import Pug from "../components/pug_walking"
import PugJump from "../components/pug_jumping"
import PugSniff from "../components/pug_sniffwalk"


import NoPetAnimated from "../components/nopet_animated"
import InAppLayout from "../components/InAppLayout"
import AsyncStorage from '@react-native-async-storage/async-storage'
import Spacer from "../components/Spacer";
import { usePetData, PET_TYPES } from "../contexts/PetContext"
import { Link } from "expo-router";
import { TokensProvider, useTokens } from "../contexts/TokenContext";
import { useUser } from "@clerk/clerk-expo";
import {  updateUserPetInfo, updateUserStatus } from '../firebaseService';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import useClerkFirebaseSync from '../hooks/useClerkFirebaseSync';

import background1 from '../assets/living room.png';
import background2 from '../assets/wreck_it_ralph_880.0.1491200032.png';
import background3 from '../assets/starry_night.png';

const backgroundImages = {
    '1': background1,
    '2': background2,
    '3': background3,
};

const PetStats = () => {
    const [happiness, setHappiness] = useState(100)
    const [energy, setEnergy] = useState(100)
    const [health, setHealth] = useState(100)
    const [loaded, setLoaded] = useState(false)
    const [isPetActive, setIsPetActive] = useState(true)
    const [lastUpdateTime, setLastUpdateTime] = useState(Date.now())
    const { petData, setPetData } = usePetData()
    const { user, isLoaded, isSignedIn } = useUser()

    useEffect(() => {
        const loadStats = async () => {
            try {
                const savedStats = await AsyncStorage.getItem('petStats')
                const savedTime = await AsyncStorage.getItem('lastUpdateTime')

                if (savedStats && savedTime) {
                    const { happiness: savedHappiness, energy: savedEnergy, health: savedHealth } = JSON.parse(savedStats)
                    const lastTime = parseInt(savedTime)
                    const currentTime = Date.now()

                    const timeDifference = (currentTime - lastTime) / 1000

                    const decayRate = 0.001
                    const totalDecay = timeDifference * decayRate

                    setHappiness(Math.max(0, savedHappiness - totalDecay))
                    setEnergy(Math.max(0, savedEnergy - totalDecay))
                    setHealth(Math.max(0, savedHealth - totalDecay))
                    setLastUpdateTime(currentTime)

                    if ((savedHappiness - totalDecay) <= 0 || (savedEnergy - totalDecay) <= 0 || (savedHealth - totalDecay) <= 0) {
                        setIsPetActive(false)
                    }
                } else {
                    setLastUpdateTime(Date.now())
                }
                setLoaded(true)
            } catch (error) {
                console.error('Failed to load stats from AsyncStorage:', error)
                setLoaded(true)
            }
        }
        loadStats()
    }, [])
    useEffect(() => {
        if (!loaded) return
        const saveStats = async () => {
            try {
                const currentTime = Date.now()
                await AsyncStorage.setItem('petStats', JSON.stringify({ happiness, energy, health }))
                await AsyncStorage.setItem('lastUpdateTime', currentTime.toString())
                setLastUpdateTime(currentTime)
            } catch (error) {
                console.error('Failed to save stats to AsyncStorage:', error)
            }
        }
        saveStats()
    }, [happiness, energy, health, loaded])

    useEffect(() => {
        if (!loaded || !isPetActive) return

        let animationId
        const updateStats = () => {
            const currentTime = Date.now()
            const timeDifference = (currentTime - lastUpdateTime) / 1000

            if (timeDifference >= 1000) {
                const decayRate = 0.001
                const decay = timeDifference * decayRate

                setHappiness(prev => Math.max(0, prev - decay))
                setEnergy(prev => Math.max(0, prev - decay))
                setHealth(prev => Math.max(0, prev - decay))
                setLastUpdateTime(currentTime)
            }

            animationId = requestAnimationFrame(updateStats)
        }

        animationId = requestAnimationFrame(updateStats)
        return () => cancelAnimationFrame(animationId)
    }, [loaded, isPetActive, lastUpdateTime])

    useEffect(() => {
        if (loaded) {
            const shouldUpdatePet = (happiness === 0 || energy === 0 || health === 0) && petData.hasPet;

            if (shouldUpdatePet) {
                setPetData({
                    ...petData,
                    hasPet: false
                });

                if (isLoaded && isSignedIn && user) {
                    try {
                        const userRef = doc(db, 'users', user.id);
                        updateDoc(userRef, {
                            hasPet: false
                        });
                    } catch (error) {
                        console.error('Failed to update hasPet status in Firestore:', error);
                    }
                }
            }
        }
    }, [happiness, energy, health, loaded, petData, setPetData, isLoaded, isSignedIn, user]);


    const increaseStats = () => {
        if (!isPetActive) return;

        setHappiness(prev => Math.min(100, prev + 5))
        setEnergy(prev => Math.min(100, prev + 3))
        setHealth(prev => Math.min(100, prev + 2))
    }

    const StatBar = ({ label, value, maxValue, color }) => {
        const percentage = (value / maxValue) * 100
        const barColor = isPetActive ? color : "#cccccc"

        return (
            <View style={styles.statContainer}>
                <View style={styles.statLabelContainer}>
                    <Text style={[styles.statLabel, !isPetActive && {color: '#aaaaaa'}]}>{label}</Text>
                    <Text style={[styles.statValue, !isPetActive && {color: '#aaaaaa'}]}>
                        {Math.round(value)}/{maxValue}
                    </Text>
                </View>
                <View style={styles.progressBarBackground}>
                    <View
                        style={[
                            styles.progressBarFill,
                            { width: `${percentage}%`, backgroundColor: barColor }
                        ]}
                    />
                </View>
            </View>
        )
    }

    return {
        happiness,
        energy,
        health,
        increaseStats,
        isPetActive,
        StatBars: () => (
            <View style={styles.statsContainer}>
                <StatBar label="Happiness" value={happiness} maxValue={100} color="#FF9966" />
                <StatBar label="Energy" value={energy} maxValue={100} color="#66CCFF" />
                <StatBar label="Hunger" value={health} maxValue={100} color="#99CC66" />
            </View>
        )
    }
}

const PetDisplay = ({ petType, backgroundData, happiness, energy, health, isPetActive }) => {
    const { petData } = usePetData();

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
    if (!petData.hasPet || !isPetActive) {
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

    const isJumping = happiness > 70 && energy > 70 && health > 40;
    const isSniffing = happiness < 20 && energy < 20 && health < 20;
    let PetComponent;

    switch (petType) {
        case 0: // Corgi
            if (isJumping) {
                PetComponent = CorgiJump;
            } else if (isSniffing) {
                PetComponent = CorgiSniff;
            } else {
                PetComponent = Corgi;
            }
            break;
        case 1: // Pomeranian
            if (isJumping) {
                PetComponent = PomJump;
            } else if (isSniffing) {
                PetComponent = PomSniff;
            } else {
                PetComponent = Pom;
            }
            break;
        case 2: // Pug
            if (isJumping) {
                PetComponent = PugJump;
            } else if (isSniffing) {
                PetComponent = PugSniff;
            } else {
                PetComponent = Pug;
            }
            break;
        default:
            if (isJumping) {
                PetComponent = CorgiJump;
            } else if (isSniffing) {
                PetComponent = CorgiSniff;
            } else {
                PetComponent = Corgi;
            }
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
                <View style={[styles.backgroundImage, { backgroundColor: '#f0f0f0' }]}>
                    <PetComponent />
                </View>
            )}
        </View>
    );
};

const Home = () => {
    const { points, minusPoint } = usePoints()
    const { points: tokens } = useTokens()
    const petStatsManager = PetStats()
    const { StatBars, increaseStats, happiness, energy, health, isPetActive } = petStatsManager
    const { petData, isLoading } = usePetData()
    const [backgroundData, setBackgroundData] = useState(null)
    const { user, isLoaded, isSignedIn } = useUser();
    const { isAuthenticated } = useClerkFirebaseSync();

    useEffect(() => {
        const loadBackground = async () => {
            try {
                const savedBackground = await AsyncStorage.getItem('selectedBackground')
                if (savedBackground) {
                    setBackgroundData(savedBackground)
                }
            } catch (error) {
                console.error('Failed to load background:', error)
            }
        }
        loadBackground()
    }, [])

    const lastPetDataRef = useRef();

    useEffect(() => {
        const updatePetInFirebase = async () => {
            const currentPetData = `${petData?.selectedPet}-${petData?.petName}`;
            if (lastPetDataRef.current === currentPetData) return;

            if (isLoaded && isSignedIn && user && petData && isAuthenticated) {
                try {
                    await updateUserPetInfo(user.id, {
                        selectedPet: petData.selectedPet,
                        petName: petData.petName
                    });
                    lastPetDataRef.current = currentPetData;
                } catch (error) {
                    console.error('Failed to update pet info:', error);
                }
            }
        };
        updatePetInFirebase();
    }, [isLoaded, isSignedIn, user?.id, isAuthenticated]);


    const feedPet = () => {
        if (points > 0 && isPetActive) {
            minusPoint()
            increaseStats()
        }
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerTitleContainer}>
                    <Text style={styles.appTitle}>Home</Text>
                </View>
                <Link href="/editProfile_home" asChild>
                    <TouchableOpacity style={styles.invitesTopButton}>
                        <AntDesign name="setting" size={14} color="#FF8C42" />
                        <Text style={styles.invitesTopButtonText}>Settings</Text>
                    </TouchableOpacity>
                </Link>
            </View>
            <Spacer height={20}/>
            <View style={styles.petContainer}>
                <View style={styles.petNameContainer}>
                    <Text style={styles.petName}>{petData.petName}</Text>
                    <Link href="/shop" asChild>
                        <TouchableOpacity style={styles.tokenIndicator}>
                            <FontAwesome5 name="paw" size={16} color="#538ed5" />
                            <Text style={styles.tokenText}>{tokens}</Text>
                        </TouchableOpacity>
                    </Link>
                </View>
                <View style={styles.petDisplayArea}>
                    <PetDisplay
                        petType={petData.selectedPet}
                        backgroundData={backgroundData}
                        happiness={happiness}
                        energy={energy}
                        health={health}
                        isPetActive={isPetActive}
                    />
                </View>
                <StatBars />
                <View style={styles.feedContainer}>
                    <View style={styles.pointsIndicator}>
                        <FontAwesome5
                            name="bone"
                            size={16}
                            color={isPetActive ? "#eb7d42" : "#cccccc"}
                        />
                        <Text style={[
                            styles.pointsText,
                            !isPetActive && {color: "#cccccc"}
                        ]}>
                            {points}
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[
                            styles.treatButton,
                            (!isPetActive || points <= 0) && styles.treatButtonDisabled
                        ]}
                        onPress={feedPet}
                        disabled={!isPetActive || points <= 0}
                    >
                        <FontAwesome5
                            name="bone"
                            size={24}
                            color="white"
                        />
                        <Text style={styles.treatText}>Feed Treat</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
                <Link href="/shop" asChild>
                    <TouchableOpacity style={styles.mainButton}>
                        <Entypo name="shop" size={22} color="white" />
                        <Text style={styles.mainButtonText}> Shop</Text>
                    </TouchableOpacity>
                </Link>
                <Link href="/petSelection" asChild>
                    <TouchableOpacity style={styles.mainButton}>
                        <Entypo name="shop" size={22} color="white" />
                        <Text style={styles.mainButtonText}> SE</Text>
                    </TouchableOpacity>
                </Link>
            </View>
        </View>
    )
}

export default function HomeWrapper() {
    const { user } = useUser();
    const {
        updateHasPetStatus,
        isAuthenticated,
        authError
    } = useClerkFirebaseSync();

    const [statusSet, setStatusSet] = useState(false);

    useEffect(() => {
        const setOfflineStatus = async () => {
            if (user?.id && isAuthenticated && !statusSet) {
                try {
                    await updateUserStatus(user.id, 'offline');
                    setStatusSet(true);
                } catch (error) {
                    console.error('Failed to set offline status:', error);
                }
            }
        };

        setOfflineStatus();
    }, [user?.id, isAuthenticated, statusSet]);

    return (
        <PointsProvider>
            <TokensProvider>
                <InAppLayout>
                    <Home />
                </InAppLayout>
            </TokensProvider>
        </PointsProvider>
    );
}


const styles = StyleSheet.create({
    mainButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#eb7d42',
        width: '93%',
        paddingVertical: 15,
        borderRadius: 13,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
        marginBottom: 20,
    },
    mainButtonText: {
        flexDirection: 'row',
        alignItems: 'center',
        color: '#ffffff',
        fontSize: 20,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        paddingTop: 45,
        paddingHorizontal: 20,
        marginLeft: 110,
    },
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingTop: 20,
    },
    pointsIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff5ee',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#ffead9',
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
    pointsText: {
        marginLeft: 6,
        fontWeight: '600',
        color: '#eb7d42',
    },
    tokenText: {
        marginLeft: 6,
        fontWeight: '600',
        color: '#538ed5',
    },
    petContainer: {
        flex: 1,
        marginHorizontal: 16,
        marginBottom: 20,
        backgroundColor: '#ffffff',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
        padding: 16,
        justifyContent: 'space-between',
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
    petDisplayArea: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 0,
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
    statsContainer: {
        marginTop: 20,
        marginBottom: 20,
        gap: 12,
    },
    statContainer: {
        marginBottom: 4,
    },
    statLabelContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#555',
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#888',
    },
    progressBarBackground: {
        height: 10,
        backgroundColor: '#f0f0f0',
        borderRadius: 5,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 5,
    },
    feedContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10
    },
    treatButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#eb7d42',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 30,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    treatButtonDisabled: {
        backgroundColor: '#ccc',
    },
    treatText: {
        marginLeft: 8,
        fontSize: 16,
        fontWeight: '600',
        color: 'white',
    },
    headerTitleContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
        marginTop: 5,
    },
    appTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#000000',
        textAlign: 'center',
    },
    invitesTopButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#FF8C42',
    },
    invitesTopButtonText: {
        color: '#FF8C42',
        fontWeight: '600',
        fontSize: 12,
        marginLeft: 5,
    },
    contentContainer: {
        flex: 1,
        paddingTop: 15,
    },
})
