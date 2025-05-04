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
    Alert,
    Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePetData, PET_TYPES } from '../contexts/PetContext';
import { useUser } from '@clerk/clerk-expo';
import { Ionicons } from '@expo/vector-icons';

// Pet images
const PET_IMAGES = {
    corgi: require('../assets/corgi1.png'),
    pomeranian: require('../assets/corgi2.png'),
    pug: require('../assets/corgi1.png'),
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

    const [selectedIndex, setSelectedIndex] = useState(petData.selectedPet);
    const [petName, setPetName] = useState(petData.petName || '');
    const [error, setError] = useState('');

    // Profile state
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isSavingProfile, setIsSavingProfile] = useState(false);

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
        setError('');
    };

    const handleContinue = async () => {
        if (selectedIndex === null) {
            setError('Please select a pet');
            return;
        }

        if (!petName.trim()) {
            setError('Please name your pet');
            return;
        }

        // Save pet selection and name to context
        await setPetData({
            selectedPet: selectedIndex,
            petName: petName.trim(),
            isConfirmed: true,
        });

        // Navigate to the next screen
        router.replace('/'); // Replace with your desired route
    };

    const handleSaveProfile = async () => {
        if (!isSignedIn || !user) {
            Alert.alert('Error', 'You need to be signed in to update your profile.');
            return;
        }

        setIsSavingProfile(true);
        try {
            await user.update({
                firstName,
                lastName,
            });

            Alert.alert('Success', 'Your profile has been updated successfully!');
            setShowProfileModal(false);
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'Failed to update profile. Please try again.');
        } finally {
            setIsSavingProfile(false);
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
                    {/* User profile button */}
                    {isSignedIn && (
                        <TouchableOpacity
                            style={styles.profileButton}
                            onPress={() => setShowProfileModal(true)}
                        >
                            <Ionicons name="person-circle-outline" size={24} color="#eb7d42" />
                            <Text style={styles.profileButtonText}>
                                {user?.firstName ? `Hi, ${user.firstName}!` : 'Edit Profile'}
                            </Text>
                        </TouchableOpacity>
                    )}

                    <View style={styles.formContainer}>
                        <Text style={styles.header}>Choose Your Pet</Text>
                        <Text style={styles.subHeader}>
                            Select a dog and give it a name
                        </Text>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
                            <Text style={styles.label}>Pet Name</Text>
                            <TextInput
                                style={styles.input}
                                value={petName}
                                placeholder="Enter your pet's name"
                                placeholderTextColor="#999"
                                onChangeText={(text) => setPetName(text)}
                                maxLength={20}
                            />
                        </View>

                        <TouchableOpacity
                            style={styles.button}
                            onPress={handleContinue}
                        >
                            <Text style={styles.buttonText}>Continue</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>

                {/* Profile Edit Modal */}
                <Modal
                    visible={showProfileModal}
                    animationType="slide"
                    transparent={true}
                    onRequestClose={() => setShowProfileModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modalContent}>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setShowProfileModal(false)}
                            >
                                <Ionicons name="close" size={24} color="#666" />
                            </TouchableOpacity>

                            <Text style={styles.modalHeader}>Edit Your Profile</Text>

                            <View style={styles.modalFormContainer}>
                                <Text style={styles.label}>First Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={firstName}
                                    onChangeText={setFirstName}
                                    placeholder="Enter your first name"
                                    autoCapitalize="words"
                                />

                                <Text style={styles.label}>Last Name</Text>
                                <TextInput
                                    style={styles.input}
                                    value={lastName}
                                    onChangeText={setLastName}
                                    placeholder="Enter your last name"
                                    autoCapitalize="words"
                                />

                                <TouchableOpacity
                                    style={[styles.button, isSavingProfile && styles.disabledButton]}
                                    onPress={handleSaveProfile}
                                    disabled={isSavingProfile}
                                >
                                    {isSavingProfile ? (
                                        <ActivityIndicator size="small" color="#fff" />
                                    ) : (
                                        <Text style={styles.buttonText}>Save Profile</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Modal>
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
        maxWidth: 400,
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
    profileButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 12,
        borderRadius: 20,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    profileButtonText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '500',
        color: '#333',
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
    petsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
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
        backgroundColor: '#f8f8f8',
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
        backgroundColor: '#f8f8f8',
    },
    button: {
        backgroundColor: '#eb7d42',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 16,
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
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 5,
    },
    closeButton: {
        alignSelf: 'flex-end',
        padding: 8,
    },
    modalHeader: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#333',
    },
    modalFormContainer: {
        width: '100%',
    },
});