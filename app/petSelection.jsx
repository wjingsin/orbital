// app/pet-selection.js

import React, { useState, useEffect } from 'react';
import {
    Text,
    TextInput,
    TouchableOpacity,
    View,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Image,
    SafeAreaView,
    ScrollView,
    ActivityIndicator,
    Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePetData, PET_TYPES } from '../contexts/PetContext';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';
import {updateUserStatus} from "../firebaseService";

// Pet images
const PET_IMAGES = {
    corgi: require('../assets/corgi1.png'),
    pomeranian: require('../assets/pom1.png'),
    pug: require('../assets/pug1.png'),
};

// Pet names for display
const PET_NAMES = {
    corgi: 'Corgi',
    pomeranian: 'Pomeranian',
    pug: 'Pug',
};

export default function PetSelectionScreen() {
    const router = useRouter();
    const { petData, setPetData, isLoading } = usePetData();
    const { isLoaded, isSignedIn, user } = useUser();

    // Profile state
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [profileError, setProfileError] = useState('');

    // Pet selection state
    const [selectedIndex, setSelectedIndex] = useState(petData.selectedPet);
    const [petName, setPetName] = useState(petData.petName || '');
    const [petError, setPetError] = useState('');

    // Loading state
    const [isSaving, setIsSaving] = useState(false);

    // Update local state if petData changes
    useEffect(() => {
        if (!isLoading) {
            setSelectedIndex(petData.selectedPet);
            setPetName(petData.petName || '');
        }
    }, [isLoading, petData]);

    // Get user data when loaded
    useEffect(() => {
        if (isLoaded && isSignedIn && user) {
            setFirstName(user.firstName || '');
            setLastName(user.lastName || '');
        }
    }, [isLoaded, isSignedIn, user]);

    const handlePetSelection = (index) => {
        setSelectedIndex(index);
        setPetError('');
    };

    const handleContinue = async () => {
        let hasError = false;

        // Validate profile information
        if (!firstName.trim()) {
            setProfileError('First name cannot be blank');
            hasError = true;
        } else if (!lastName.trim()) {
            setProfileError('Last name cannot be blank');
            hasError = true;
        } else {
            setProfileError('');
        }

        // Validate pet selection
        if (selectedIndex === null) {
            setPetError('Please select a pet');
            hasError = true;
        } else if (!petName.trim()) {
            setPetError('Please name your pet');
            hasError = true;
        } else {
            setPetError('');
        }

        if (hasError) return;

        // Everything is valid, proceed with saving
        setIsSaving(true);

        try {
            // First update user profile if signed in
            if (isSignedIn && user) {
                await user.update({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                });
            }

            // Then save pet selection
            await setPetData({
                selectedPet: selectedIndex,
                petName: petName.trim(),
                isConfirmed: true,
            });

            // Navigate to the next screen
            router.replace('/afterAugment'); // Replace with your desired route

        } catch (error) {
            console.error('Error saving data:', error);
            Alert.alert('Error', 'Failed to save your information. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Loading state for both pet data and user auth
    if (isLoading || !isLoaded) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#eb7d42" />
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.formContainer}>
                        <Text style={styles.header}>Setup Your Profile</Text>
                        <Text style={styles.subHeader}>
                            Tell us about yourself and choose your pet companion
                        </Text>

                        {/* User Profile Section */}
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionTitle}>
                                <Ionicons name="person" size={20} color="#eb7d42" /> Your Information
                            </Text>

                            {profileError ? (
                                <Text style={styles.errorText}>{profileError}</Text>
                            ) : null}

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>First Name <Text style={styles.requiredStar}>*</Text></Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        !firstName.trim() && profileError ? styles.inputError : null
                                    ]}
                                    value={firstName}
                                    onChangeText={(text) => {
                                        setFirstName(text);
                                        if (text.trim()) setProfileError('');
                                    }}
                                    placeholder="Enter your first name"
                                    placeholderTextColor="#999"
                                    autoCapitalize="words"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Last Name <Text style={styles.requiredStar}>*</Text></Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        !lastName.trim() && profileError ? styles.inputError : null
                                    ]}
                                    value={lastName}
                                    onChangeText={(text) => {
                                        setLastName(text);
                                        if (text.trim()) setProfileError('');
                                    }}
                                    placeholder="Enter your last name"
                                    placeholderTextColor="#999"
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

                        {/* Pet Selection Section */}
                        <View style={styles.sectionContainer}>
                            <Text style={styles.sectionTitle}>
                                <Ionicons name="paw" size={20} color="#eb7d42" /> Choose Your Pet
                            </Text>

                            {petError ? <Text style={styles.errorText}>{petError}</Text> : null}

                            <View style={styles.petsContainer}>
                                {PET_TYPES.map((petType, index) => (
                                    <TouchableOpacity
                                        key={index}
                                        style={[
                                            styles.petOption,
                                            selectedIndex === index && styles.selectedPet,
                                        ]}
                                        onPress={() => handlePetSelection(index)}
                                    >
                                        <Image
                                            source={PET_IMAGES[petType]}
                                            style={styles.petImage}
                                            resizeMode="contain"
                                        />
                                        <Text style={styles.petLabel}>{PET_NAMES[petType]}</Text>
                                        <View
                                            style={[
                                                styles.checkmark,
                                                selectedIndex === index && styles.checkmarkVisible,
                                            ]}
                                        >
                                            <Text style={styles.checkmarkText}>✓</Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Pet Name <Text style={styles.requiredStar}>*</Text></Text>
                                <TextInput
                                    style={[
                                        styles.input,
                                        !petName.trim() && petError ? styles.inputError : null
                                    ]}
                                    value={petName}
                                    placeholder="Enter your pet's name"
                                    placeholderTextColor="#999"
                                    onChangeText={(text) => {
                                        setPetName(text);
                                        if (text.trim()) setPetError('');
                                    }}
                                    maxLength={20}
                                />
                            </View>
                        </View>

                        {/* Submit Button */}
                        <TouchableOpacity
                            style={[styles.button, isSaving && styles.disabledButton]}
                            onPress={handleContinue}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator size="small" color="#fff" />
                            ) : (
                                <Text style={styles.buttonText}>Continue</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ffffff',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    formContainer: {
        width: '100%',
        maxWidth: 500,
        alignSelf: 'center',
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
        textAlign: 'center',
        color: '#333',
    },
    subHeader: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        color: '#666',
    },
    sectionContainer: {
        marginBottom: 24,
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        padding: 16,
        borderLeftWidth: 4,
        borderLeftColor: '#eb7d42',
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        color: '#333',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
    },
    petsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    petOption: {
        width: '30%',
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        position: 'relative',
        backgroundColor: '#fff',
    },
    selectedPet: {
        borderColor: '#eb7d42',
        backgroundColor: '#fff0e8',
    },
    petImage: {
        width: '75%',
        height: '75%',
    },
    petLabel: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 4,
        color: '#666',
        textAlign: 'center',
    },
    checkmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#eb7d42',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0,
    },
    checkmarkVisible: {
        opacity: 1,
    },
    checkmarkText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 8,
        color: '#444',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    inputError: {
        borderColor: '#e74c3c',
        backgroundColor: '#ffeaea',
    },
    button: {
        backgroundColor: '#eb7d42',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
        elevation: 2,
    },
    buttonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '600',
    },
    disabledButton: {
        opacity: 0.7,
    },
    errorText: {
        color: '#e74c3c',
        textAlign: 'center',
        marginBottom: 16,
        fontWeight: '500',
    },
    requiredStar: {
        color: '#e74c3c',
        fontWeight: 'bold',
    },
});