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
import {router, useRouter} from 'expo-router';
import { usePetData, PET_TYPES } from '../contexts/PetContext';
import { useUser } from '@clerk/clerk-expo';
import {FontAwesome5, Ionicons} from '@expo/vector-icons';
import { updateUserStatus } from "../firebaseService";
import { doc, updateDoc } from 'firebase/firestore'; // <-- Add this
import { db } from '../firebaseConfig';
import Spacer from "../components/Spacer"; // <-- Add this
import { SignOutButton } from '../components/SignOutButton';

const PET_IMAGES = {
    corgi: require('../assets/corgi1.png'),
    pomeranian: require('../assets/pom1.png'),
    pug: require('../assets/pug1.png'),
};

const PET_NAMES = {
    corgi: 'Corgi',
    pomeranian: 'Pomeranian',
    pug: 'Pug',
};

export default function PetSelectionScreen() {
    const router = useRouter();
    const { petData, setPetData, isLoading } = usePetData();
    const { isLoaded, isSignedIn, user } = useUser();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [profileError, setProfileError] = useState('');
    const [selectedIndex, setSelectedIndex] = useState(petData.selectedPet);
    const [petName, setPetName] = useState(petData.petName || '');
    const [petError, setPetError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!isLoading) {
            setSelectedIndex(petData.selectedPet);
            setPetName(petData.petName || '');
        }
    }, [isLoading, petData]);

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
        if (!firstName.trim()) {
            setProfileError('First name cannot be blank');
            hasError = true;
        } else if (!lastName.trim()) {
            setProfileError('Last name cannot be blank');
            hasError = true;
        } else {
            setProfileError('');
        }

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

        setIsSaving(true);
        try {
            if (isSignedIn && user) {
                await user.update({
                    firstName: firstName.trim(),
                    lastName: lastName.trim(),
                });
            }

            await setPetData({
                selectedPet: selectedIndex,
                petName: petName.trim(),
                isConfirmed: true,
                hasPet: true,
            });
            if (isSignedIn && user) {
                try {
                    const userRef = doc(db, 'users', user.id);
                    await updateDoc(userRef, {
                        petSelection: selectedIndex,
                        petName: petName.trim(),
                        hasPet: true,
                    });
                } catch (error) {
                    console.error('Failed to update pet info in Firestore:', error);
                }
            }

            router.replace('/afterAugment');

        } catch (error) {
            console.error('Error saving data:', error);
            Alert.alert('Error', 'Failed to save your information. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };


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
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <FontAwesome5 name="arrow-left" size={24} color="#343a40" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Settings</Text>
                </View>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <View style={styles.formContainer}>
                        <Text style={styles.headerTitle}>Edit Profile</Text>
                        <Spacer height={30} />
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

                        <View style={styles.sectionContainer}>


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
                <View style={styles.scrollContent}>
                <SignOutButton />
                </View>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#343a40',
        paddingRight: 172,
        marginTop: 5,
    },
    sectionContainer: {
        marginBottom: 24,
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        padding: 16,
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
    backButton: {
        padding: 8,
        paddingLeft: 20,
    },
});