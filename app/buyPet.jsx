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
import {useRouter, useLocalSearchParams, router} from 'expo-router';
import { usePetData, PET_TYPES } from '../contexts/PetContext';
import { useUser } from '@clerk/clerk-expo';
import {FontAwesome5, Ionicons} from '@expo/vector-icons';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { useTokens } from '../contexts/TokenContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function BuyPetScreen({ route }) {
    const router = useRouter();

    const petPrice = route?.params?.petPrice || 1000;

    const { petData, setPetData } = usePetData();
    const { isLoaded, isSignedIn, user } = useUser();
    const { points, minusPoint } = useTokens();

    const [selectedIndex, setSelectedIndex] = useState(null);
    const [petName, setPetName] = useState('');
    const [petError, setPetError] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handlePetSelection = (index) => {
        setSelectedIndex(index);
        setPetError('');
    };

    const handleConfirm = async () => {
        if (selectedIndex === null) {
            setPetError('Please select a pet type.');
            return;
        }

        if (!petName.trim()) {
            setPetError('Please enter a pet name.');
            return;
        }

        if (points < petPrice) {
            Alert.alert('Insufficient Tokens', `You need ${petPrice - points} more tokens to adopt a pet.`);
            return;
        }

        setIsSaving(true);
        try {
            minusPoint(petPrice);

            const currentTime = Date.now();
            await AsyncStorage.setItem('petStats', JSON.stringify({
                happiness: 100,
                energy: 100,
                health: 100
            }));
            await AsyncStorage.setItem('lastUpdateTime', currentTime.toString());

            const updatedPetData = {
                selectedPet: selectedIndex,
                petName: petName.trim(),
                isConfirmed: true,
                hasPet: true,
            };

            await setPetData(updatedPetData);

            if (isSignedIn && user) {
                const userRef = doc(db, 'users', user.id);
                await updateDoc(userRef, {
                    petSelection: selectedIndex,
                    petName: petName.trim(),
                    hasPet: true,
                    tokens: points - petPrice,
                });
            }

            Alert.alert('Success', 'You have adopted a new pet!');
            router.replace('/home');
        } catch (error) {
            console.error('Failed to adopt pet:', error);
            Alert.alert('Error', 'Failed to adopt pet. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };


    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.container}
            >
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <FontAwesome5 name="arrow-left" size={25} color="#555" />
                </TouchableOpacity>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <Text style={styles.header}>Adopt Your Pet</Text>

                    {petError ? <Text style={styles.errorText}>{petError}</Text> : null}

                    <View style={styles.petsContainer}>
                        {PET_TYPES.map((petType, index) => (
                            <TouchableOpacity
                                key={petType}
                                style={[
                                    styles.petOption,
                                    selectedIndex === index && styles.selectedPet
                                ]}
                                onPress={() => handlePetSelection(index)}
                            >
                                <Image source={PET_IMAGES[petType]} style={styles.petImage} />
                                <Text style={styles.petLabel}>{PET_NAMES[petType]}</Text>
                                {selectedIndex === index && (
                                    <View style={styles.checkmark}>
                                        <Text style={styles.checkmarkText}>✓</Text>
                                    </View>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Pet Name *</Text>
                        <TextInput
                            style={[
                                styles.input,
                                petError && !petName.trim() && styles.inputError
                            ]}
                            placeholder="Enter pet name"
                            value={petName}
                            onChangeText={(text) => {
                                setPetName(text);
                                if (text.trim()) setPetError('');
                            }}
                            maxLength={20}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.button, isSaving && styles.disabledButton]}
                        onPress={handleConfirm}
                        disabled={isSaving}
                    >
                        {isSaving ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.buttonText}>Confirm Adoption ({petPrice} tokens)</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: '#fff' },
    container: { flex: 1, backgroundColor: '#fff' },
    scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 20 },
    header: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, textAlign: 'center' },
    petsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
    petOption: {
        width: '30%',
        aspectRatio: 1,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#ddd',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 8,
        backgroundColor: '#fff',
        position: 'relative',
    },
    selectedPet: { borderColor: '#eb7d42', backgroundColor: '#fff0e8' },
    petImage: { width: '75%', height: '75%' },
    petLabel: { fontSize: 12, fontWeight: '500', marginTop: 4, color: '#666', textAlign: 'center' },
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
    },
    checkmarkText: { color: '#fff', fontWeight: 'bold' },
    inputContainer: { marginBottom: 16 },
    label: { fontSize: 16, fontWeight: '600', marginBottom: 8 },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    inputError: { borderColor: '#e74c3c', backgroundColor: '#ffeaea' },
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
    buttonText: { color: '#fff', fontSize: 18, fontWeight: '600' },
    disabledButton: { opacity: 0.7 },
    errorText: { color: '#e74c3c', textAlign: 'center', marginBottom: 16, fontWeight: '500' },
    backButton: {
        padding: 20,
        marginTop: -15,
        marginLeft: 4,
    },
});
