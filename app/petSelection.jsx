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
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePetData, PET_TYPES } from '../contexts/PetContext';

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
    const [selectedIndex, setSelectedIndex] = useState(petData.selectedPet);
    const [petName, setPetName] = useState(petData.petName || '');
    const [error, setError] = useState('');

    // Update local state if petData changes
    useEffect(() => {
        if (!isLoading) {
            setSelectedIndex(petData.selectedPet);
            setPetName(petData.petName || '');
        }
    }, [isLoading, petData]);

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

    if (isLoading) {
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
    errorText: {
        color: '#e74c3c',
        textAlign: 'center',
        marginBottom: 16,
    },
});