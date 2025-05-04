import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import React, { useState, useEffect } from 'react'
import { FontAwesome5 } from '@expo/vector-icons'
import { PointsProvider, usePoints } from "../contexts/PointsContext"
import Corgi from "../components/corgi_animated"
import InAppLayout from "../components/InAppLayout"
import AsyncStorage from '@react-native-async-storage/async-storage'
import Spacer from "../components/Spacer";
import Pom from "../components/pom_animated"
import Pug from "../components/pom_animated"
import { usePetData, PET_TYPES } from "../contexts/PetContext"

// PetStats component that manages decreasing stats over time
const PetStats = () => {
    const [happiness, setHappiness] = useState(100)
    const [energy, setEnergy] = useState(100)
    const [health, setHealth] = useState(100)
    const [loaded, setLoaded] = useState(false)
    const { points } = usePoints()

    // Load stats from AsyncStorage on mount
    useEffect(() => {
        const loadStats = async () => {
            try {
                const savedStats = await AsyncStorage.getItem('petStats')
                if (savedStats) {
                    const { happiness: savedHappiness, energy: savedEnergy, health: savedHealth } = JSON.parse(savedStats)
                    setHappiness(savedHappiness)
                    setEnergy(savedEnergy)
                    setHealth(savedHealth)
                }
                setLoaded(true)
            } catch (error) {
                console.error('Failed to load stats from AsyncStorage:', error)
                setLoaded(true)
            }
        }

        loadStats()
    }, [])

    // Save stats to AsyncStorage whenever they change
    useEffect(() => {
        if (!loaded) return

        const saveStats = async () => {
            try {
                await AsyncStorage.setItem('petStats', JSON.stringify({ happiness, energy, health }))
            } catch (error) {
                console.error('Failed to save stats to AsyncStorage:', error)
            }
        }

        saveStats()
    }, [happiness, energy, health, loaded])

    // Decrease stats over time
    useEffect(() => {
        if (!loaded) return

        const interval = setInterval(() => {
            setHappiness(prev => Math.max(0, prev - 0.5))
            setEnergy(prev => Math.max(0, prev - 0.3))
            setHealth(prev => Math.max(0, prev - 0.1))
        }, 10000) // Decrease every 10 seconds

        return () => clearInterval(interval)
    }, [loaded])

    // Function to increase stats when fed
    const increaseStats = () => {
        setHappiness(prev => Math.min(100, prev + 5))
        setEnergy(prev => Math.min(100, prev + 3))
        setHealth(prev => Math.min(100, prev + 2))
    }

    // Individual stat bar component
    const StatBar = ({ label, value, maxValue, color }) => {
        const percentage = (value / maxValue) * 100

        return (
            <View style={styles.statContainer}>
                <View style={styles.statLabelContainer}>
                    <Text style={styles.statLabel}>{label}</Text>
                    <Text style={styles.statValue}>{Math.round(value)}/{maxValue}</Text>
                </View>
                <View style={styles.progressBarBackground}>
                    <View
                        style={[
                            styles.progressBarFill,
                            { width: `${percentage}%`, backgroundColor: color }
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
        StatBars: () => (
            <View style={styles.statsContainer}>
                <StatBar label="Happiness" value={happiness} maxValue={100} color="#FF9966" />
                <StatBar label="Energy" value={energy} maxValue={100} color="#66CCFF" />
                <StatBar label="Health" value={health} maxValue={100} color="#99CC66" />
            </View>
        )
    }
}

const PetDisplay = ({ petType }) => {
    switch (petType) {
        case 0: // Corgi
            return <Corgi />;
        case 1: // Pomeranian
            return <Pom />;
        case 2: // Pug
            return <Pug />;
        default:
            return <Corgi />; // Default to Corgi if something goes wrong
    }
};

const Home = () => {
    const { points, minusPoint } = usePoints()
    const petStatsManager = PetStats()
    const { StatBars, increaseStats } = petStatsManager
    const { petData, isLoading } = usePetData()

    // Function to feed the pet
    const feedPet = () => {
        if (points > 0) {
            minusPoint()
            increaseStats()
        }
    }

    return (
        <View style={styles.container}>
            {/* Pet Display */}
            <Spacer height={30}/>
            <View style={styles.petContainer}>
                <View style={styles.petNameContainer}>
                    <Text style={styles.petName}>{petData.petName}</Text>
                </View>

                <View style={styles.petDisplayArea}>
                    <View style={styles.petBackground}>
                        <PetDisplay petType={petData.selectedPet} />
                    </View>
                </View>

                {/* Pet Stats */}
                <StatBars />

                {/* Treat Button and Points */}
                <View style={styles.feedContainer}>
                    <View style={styles.pointsIndicator}>
                        <FontAwesome5 name="bone" size={16} color="#eb7d42" />
                        <Text style={styles.pointsText}>{points}</Text>
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.treatButton,
                            points <= 0 && styles.treatButtonDisabled
                        ]}
                        onPress={feedPet}
                        disabled={points <= 0}
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
        </View>
    )
}

export default function HomeWrapper() {
    return (
        <PointsProvider>
            <InAppLayout>
                <Home />
            </InAppLayout>
        </PointsProvider>
    )
}

const styles = StyleSheet.create({
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
    pointsText: {
        marginLeft: 6,
        fontWeight: '600',
        color: '#eb7d42',
    },
    petContainer: {
        flex: 1,
        marginHorizontal: 16,
        marginTop: 20,
        marginBottom: 20,
        backgroundColor: '#ffffff',
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 2,
        padding: 16,
        justifyContent: 'space-between',
    },
    petNameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
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
        backgroundColor: '#f9f9f9',
        width: '100%',
        borderRadius: 16,
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#f0f0f0',
        overflow: 'hidden',
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
        marginTop: 20,
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
    // Journal styles removed
})