import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated, Alert } from 'react-native';
import Slider from '@react-native-community/slider';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Corgi from "../components/corgi_sniffing_park";
import CorgiJump from "../components/corgi_running_park";
import Pom from "../components/pom_sniffing_park";
import PomJump from "../components/pom_running_park";
import Pug from "../components/pug_sniffing_park";
import PugJump from "../components/pug_running_park";
import NoPetAnimated from "../components/nopet_animated";
import InAppLayout from "../components/InAppLayout";
import { usePetData } from "../contexts/PetContext";
import { useTokens } from "../contexts/TokenContext";
import Spacer from "../components/Spacer";

const FocusTimer = () => {
    const [timeRemaining, setTimeRemaining] = useState(60 * 60);
    const [selectedTime, setSelectedTime] = useState(60);
    const [isRunning, setIsRunning] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [petAnimation, setPetAnimation] = useState('walk');
    const [earnedThisSession, setEarnedThisSession] = useState(0);
    const [tokenRate, setTokenRate] = useState(1);

    const pulseAnimation = useRef(new Animated.Value(1)).current;
    const timerRef = useRef(null);

    const tokenPulse = useRef(new Animated.Value(1)).current;
    const tokenEarnedAnim = useRef(new Animated.Value(0)).current;
    const tokenEarnedOpacity = useRef(new Animated.Value(0)).current;

    const { petData } = usePetData();

    const { points, addPoint } = useTokens();

    useEffect(() => {
        if (isRunning && !isPaused) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnimation, {
                        toValue: 1.05,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnimation, {
                        toValue: 1,
                        duration: 1000,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        } else {
            pulseAnimation.setValue(1);
        }
    }, [isRunning, isPaused]);

    useEffect(() => {
        if (isRunning && !isPaused) {
            setPetAnimation('run');
        } else {
            setPetAnimation('walk');
        }
    }, [isRunning, isPaused]);

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

    const showEarnedAnimation = () => {
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
        if (isRunning && !isPaused) {
            timerRef.current = setInterval(() => {
                setTimeRemaining(prev => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        setIsRunning(false);
                        setPetAnimation('walk');

                        Alert.alert(
                            "Focus Session Complete!",
                            `You earned ${earnedThisSession} tokens in this session.\nYour total tokens: ${points}`,
                            [{ text: "OK", onPress: () => console.log("Session complete acknowledged") }]
                        );

                        return 0;
                    }
                    return prev - 1;
                });

                addPoint(tokenRate + 1000);
                setEarnedThisSession(prev => prev + tokenRate);

                if (timeRemaining % 1 === 0) {
                    pulseTokenIcon();
                    showEarnedAnimation();
                }
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isRunning, isPaused, addPoint, tokenRate, timeRemaining, earnedThisSession, points]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleTimeChange = (value) => {
        const minutes = Math.round(value);
        setSelectedTime(minutes);
        setTimeRemaining(minutes * 60);
    };

    const startTimer = () => {
        setTimeRemaining(selectedTime * 60);
        setIsRunning(true);
        setIsPaused(false);
        setPetAnimation('run');
        setEarnedThisSession(0);
    };

    const pauseTimer = () => {
        setIsPaused(true);
        setPetAnimation('walk');
    };

    const resumeTimer = () => {
        setIsPaused(false);
        setPetAnimation('run');
    };

    const quitSession = () => {
        Alert.alert(
            "Quit Session",
            "Are you sure you want to quit your current focus session?",
            [
                {
                    text: "Cancel",
                    style: "cancel"
                },
                {
                    text: "Quit",
                    onPress: () => {
                        clearInterval(timerRef.current);
                        setIsRunning(false);
                        setIsPaused(false);
                        setTimeRemaining(selectedTime * 60);
                        setPetAnimation('walk');
                        setEarnedThisSession(0);
                    },
                    style: "destructive"
                }
            ]
        );
    };

    let PetComponent;
    let PetRunningComponent;

    if (!petData.hasPet) {
        PetComponent = NoPetAnimated;
        PetRunningComponent = NoPetAnimated;
    } else {
        switch (petData.selectedPet) {
            case 0: // Corgi
                PetComponent = Corgi;
                PetRunningComponent = CorgiJump;
                break;
            case 1: // Pomeranian
                PetComponent = Pom;
                PetRunningComponent = PomJump;
                break;
            case 2: // Pug
                PetComponent = Pug;
                PetRunningComponent = PugJump;
                break;
            default:
                PetComponent = Corgi;
                PetRunningComponent = CorgiJump;
        }
    }

    return (
        <InAppLayout>
            <View style={styles.container}>
                <Spacer height={15}/>
                <View style={styles.headerContainer}>
                    <Text style={styles.header}>Focus</Text>
                </View>
                <View style={styles.petBackgroundContainer}>
                    <View style={styles.petBackground}>
                        {petAnimation === 'walk' ? <PetComponent /> : <PetRunningComponent />}
                    </View>

                    <View style={styles.timerOverlay}>
                        <Animated.View
                            style={[
                                styles.timerCircle,
                                { transform: [{ scale: pulseAnimation }] }
                            ]}
                        >
                            <View style={styles.timerInnerCircle}>
                                <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>

                                {!isRunning ? (
                                    <TouchableOpacity
                                        style={styles.startButton}
                                        onPress={startTimer}
                                    >
                                        <Text style={styles.buttonText}>START</Text>
                                    </TouchableOpacity>
                                ) : isPaused ? (
                                    <View style={styles.buttonRow}>
                                        <TouchableOpacity
                                            style={styles.resumeButton}
                                            onPress={resumeTimer}
                                        >
                                            <Text style={styles.buttonText}>RESUME</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.quitButton}
                                            onPress={quitSession}
                                        >
                                            <Text style={styles.buttonText}>QUIT</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.buttonRow}>
                                        <TouchableOpacity
                                            style={styles.pauseButton}
                                            onPress={pauseTimer}
                                        >
                                            <Text style={styles.buttonText}>PAUSE</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.quitButton}
                                            onPress={quitSession}
                                        >
                                            <Text style={styles.buttonText}>QUIT</Text>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </Animated.View>
                    </View>
                </View>
                {!isRunning && (
                    <View style={styles.tokenContainer}>
                        <Text style={styles.sliderLabel}>
                            Focus Time: {selectedTime} min
                        </Text>
                        <Slider
                            style={styles.slider}
                            minimumValue={1}
                            maximumValue={120}
                            step={1}
                            value={selectedTime}
                            onValueChange={handleTimeChange}
                            minimumTrackTintColor="#eb7d42"
                            maximumTrackTintColor="#d3d3d3"
                            thumbTintColor="#eb7d42"
                        />
                    </View>
                )}
                {isRunning && (
                    <View style={styles.tokenContainer}>
                        <View style={styles.totalTokensContainer}>
                            <Animated.View style={{ transform: [{ scale: tokenPulse }] }}>
                                <MaterialCommunityIcons name="paw" size={24} color="#538ed5" />
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
                                {tokenRate} <MaterialCommunityIcons name="paw" size={14} color="#538ed5" /> / sec
                            </Text>
                        </View>

                        <View style={styles.sessionStatsContainer}>
                            <Text style={styles.sessionStatsText}>
                                Earned this session: {earnedThisSession}
                            </Text>
                        </View>
                    </View>
                )}
            </View>
        </InAppLayout>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        padding: 16,
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 40,
        marginBottom: 20,
        color: '#343a40',
    },
    petBackgroundContainer: {
        position: 'relative',
        width: '100%',
        height: 600,
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 20,
    },
    petBackground: {
        position: 'absolute',
        width: '100%',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
    },
    timerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 300,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    timerCircle: {
        width: 220,
        height: 180,
        borderRadius: 30,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 10,
    },
    timerInnerCircle: {
        width: 200,
        height: 200,
        borderRadius: 100,
        alignItems: 'center',
        justifyContent: 'center',
    },
    timerText: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#343a40',
        marginBottom: 10,
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 5,
    },
    startButton: {
        backgroundColor: '#eb7d42',
        paddingVertical: 10,
        paddingHorizontal: 30,
        borderRadius: 25,
    },
    pauseButton: {
        backgroundColor: '#ff6b6b',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        marginRight: 10,
    },
    resumeButton: {
        backgroundColor: '#eb7d42',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
        marginRight: 10,
    },
    quitButton: {
        backgroundColor: '#6c757d',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    buttonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    sliderContainer: {
        backgroundColor: '#fafcff',
        borderRadius: 15,
        padding: 15,
        marginHorizontal: 20,
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    sliderLabel: {
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        color: '#555',
        marginBottom: 10,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    tokenContainer: {
        backgroundColor: '#fafcff',
        borderRadius: 15,
        padding: 5,
        marginHorizontal: 0,
        marginTop: 0,
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
        fontSize: 26,
        fontWeight: 'bold',
        color: '#538ed5',
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

export default FocusTimer;
