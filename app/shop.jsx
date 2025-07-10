import { StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, Image, ImageBackground, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTokens } from "../contexts/TokenContext";
import InAppLayout from "../components/InAppLayout";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, Link } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { usePetData, PET_TYPES } from "../contexts/PetContext";
import { PointsProvider, usePoints } from "../contexts/PointsContext"

import background1 from '../assets/living room.png';
import background2 from '../assets/wreck_it_ralph_880.0.1491200032.png';
import background3 from '../assets/starry_night.png';

// Import pet images
import corgiImage from '../assets/3pets.png';
import pomImage from '../assets/pom2.png';
import pugImage from '../assets/pug1.png';
import Spacer from "../components/Spacer";

const backgroundOptions = [
    {
        id: '1',
        name: 'Living Room',
        image: background1,
        thumbnailColor: '#a8e6cf',
        price: 1000,
        description: 'Your pet\'s living area',
        imageUri: require('../assets/living room.png')
    },
    {
        id: '2',
        name: 'wreck-it-ralph',
        image: background2,
        thumbnailColor: '#ffaaa5',
        price: 2000,
        description: 'wreck',
        imageUri: require('../assets/wreck_it_ralph_880.0.1491200032.png')
    },
    {
        id: '3',
        name: 'Starry Night',
        image: background3,
        thumbnailColor: '#3a4f6a',
        price: 3000,
        description: 'A magical night sky filled with stars',
        imageUri: require('../assets/starry_night.png')
    },
];

// Add pet options
const petOptions = [
    {
        id: 'pet',
        name: 'Adopt a Pet',
        thumbnailColor: '#ffd3b6',
        price: 1000,
        description: 'Adopt a pet companion',
        imageUri: corgiImage
    }
];

// Add this after your existing options arrays
const treatOptions = [
    {
        id: 'treat1',
        name: '20 Treats',
        thumbnailColor: '#009cff',
        price: 200,
        description: 'A delicious bone-shaped treat for your pet',
        iconName: 'bone', // FontAwesome icon name
        iconSize: 40,
        iconColor: '#ffffff'
    },
];


const BackgroundItem = ({ item, onPurchase, purchasedItems }) => {
    const isPurchased = purchasedItems.includes(item.id);
    return (
        <View style={[styles.itemContainer, { backgroundColor: item.thumbnailColor + '40' }]}>
            <View style={styles.itemPreview}>
                <Image source={item.imageUri} style={styles.backgroundPreview} />
            </View>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <View style={styles.priceContainer}>
                    <FontAwesome5 name="paw" size={14} color="#538ed5" />
                    <Text style={styles.priceText}>{item.price}</Text>
                </View>
            </View>
            <TouchableOpacity
                style={[styles.purchaseButton, isPurchased && styles.applyButton]}
                onPress={() => onPurchase(item)}>
                <Text style={styles.buttonText}>
                    {isPurchased ? 'Apply' : 'Purchase'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

// Updated PetItem component using Link for navigation
const PetItem = ({ item, hasPet }) => {
    return (
        <View style={[styles.itemContainer, { backgroundColor: item.thumbnailColor + '40' }]}>
            <View style={styles.itemPreview}>
                <Image source={item.imageUri} style={styles.backgroundPreview} />
            </View>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <View style={styles.priceContainer}>
                    <FontAwesome5 name="paw" size={14} color="#538ed5" />
                    <Text style={styles.priceText}>{item.price}</Text>
                </View>
            </View>
            <Link href="/buyPet" asChild>
                <TouchableOpacity
                    style={styles.purchaseButton}
                    disabled={hasPet}>
                    <Text style={styles.buttonText}>
                        {hasPet ? 'Owned' : 'Adopt'}
                    </Text>
                </TouchableOpacity>
            </Link>
        </View>
    );
};

const TreatItem = ({ item, onPurchase }) => {
    return (
        <View style={[styles.itemContainer, { backgroundColor: item.thumbnailColor +'40' }]}>
            <View style={styles.itemPreview}>
                <FontAwesome5
                    name={item.iconName}
                    size={item.iconSize}
                    color={item.iconColor}
                />
            </View>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
                <View style={styles.priceContainer}>
                    <FontAwesome5 name="paw" size={16} color="#538ed5" />
                    <Text style={styles.priceText}>{item.price}</Text>
                </View>
            </View>
            <TouchableOpacity
                style={styles.purchaseButton}
                onPress={() => onPurchase(item)}>

            <Text style={styles.buttonText}>Buy Treat</Text>
            </TouchableOpacity>
        </View>
    );
};


const Shop = () => {
    const { points, minusPoint } = useTokens();
    const { purchasePoint } = usePoints()
    const [purchasedItems, setPurchasedItems] = useState([]);
    const [selectedBackground, setSelectedBackground] = useState(null);
    const { user } = useUser();
    const { petData, setPetData } = usePetData();

    // Load purchased items and selected background on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const savedPurchases = await AsyncStorage.getItem('purchasedBackgrounds');
                if (savedPurchases) {
                    setPurchasedItems(JSON.parse(savedPurchases));
                }
                const savedBackground = await AsyncStorage.getItem('selectedBackground');
                if (savedBackground) {
                    setSelectedBackground(JSON.parse(savedBackground));
                }
            } catch (error) {
                console.error('Failed to load data from AsyncStorage:', error);
            }
        };
        loadData();
    }, []);

    // Handle purchase or application of background
    const handlePurchase = async (item) => {
        // If already purchased, apply the background
        if (purchasedItems.includes(item.id)) {
            try {
                // Store the background information in AsyncStorage
                const backgroundData = {
                    id: item.id,
                    name: item.name,
                    imagePath: item.id // We'll use the id to look up the image in Home.jsx
                };
                await AsyncStorage.setItem('selectedBackground', JSON.stringify(backgroundData));
                setSelectedBackground(backgroundData);
                // Update background in Firebase
                if (user && user.id) {
                    const userRef = doc(db, 'users', user.id);
                    await updateDoc(userRef, {
                        backgroundData: backgroundData
                    });
                }
                Alert.alert('Success', `${item.name} background applied!`);
                // Return to home screen to see changes
                setTimeout(() => {
                    router.replace('/home');
                }, 1000);
            } catch (error) {
                console.error('Failed to apply background:', error);
                Alert.alert('Error', 'Failed to apply background. Please try again.');
            }
            return;
        }

        // Otherwise, attempt to purchase
        if (points >= item.price) {
            try {
                // Deduct tokens
                minusPoint(item.price);
                // Add to purchased items
                const newPurchasedItems = [...purchasedItems, item.id];
                setPurchasedItems(newPurchasedItems);
                await AsyncStorage.setItem('purchasedBackgrounds', JSON.stringify(newPurchasedItems));
                // Apply the background
                const backgroundData = {
                    id: item.id,
                    name: item.name,
                    imagePath: item.id // We'll use the id to look up the image in Home.jsx
                };
                await AsyncStorage.setItem('selectedBackground', JSON.stringify(backgroundData));
                setSelectedBackground(backgroundData);
                // Update background and purchased items in Firebase
                if (user && user.id) {
                    const userRef = doc(db, 'users', user.id);
                    await updateDoc(userRef, {
                        backgroundData: backgroundData,
                        purchasedBackgrounds: newPurchasedItems
                    });
                }
                Alert.alert('Success', `${item.name} background purchased and applied!`);
                // Return to home screen to see changes
                setTimeout(() => {
                    router.replace('/home');
                }, 1000);
            } catch (error) {
                console.error('Failed to purchase background:', error);
                Alert.alert('Error', 'Failed to purchase background. Please try again.');
            }
        } else {
            Alert.alert('Insufficient Tokens', `You need ${item.price - points} more tokens to purchase this background.`);
        }
    };
    const handleTreatPurchase = (treat) => {
        if (points >= treat.price) {
            minusPoint(treat.price);
            purchasePoint();
            Alert.alert('Success', `${treat.name} purchased! Your pet will love it.`);
        } else {
            Alert.alert('Insufficient Points', `You need ${treat.price - points} more points to purchase this treat.`);
        }
    };


    return (
        <View style={styles.container}>
            <Spacer height={6} />
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <FontAwesome5 name="arrow-left" size={24} color="#343a40" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Shop</Text>
                <Spacer width={38} />
            </View>
            <View style={styles.tokenView}>
                <View style={[styles.tokenContainer, {marginTop: -75}]}>
                    <FontAwesome5 name="paw" size={16} color="#538ed5" />
                    <Text style={styles.tokenText}>{points}</Text>
                </View>
            </View>
            <ScrollView>
            {/* Pet Section */}
            <Text style={styles.sectionTitle}>Adopt a Pet</Text>
            <Text style={styles.subtitle}>Get a furry companion</Text>
            {petOptions.map(item => (
                <PetItem
                    key={item.id}
                    item={item}
                    hasPet={petData.hasPet}
                />
            ))}
                {/* Add Treats Section */}
            <Text style={styles.sectionTitle}>Treats</Text>
            <Text style={styles.subtitle}>Buy treats for your pet</Text>

            <FlatList
                data={treatOptions}
                renderItem={({ item }) => (
                    <TreatItem
                        item={item}
                        onPurchase={handleTreatPurchase}
                    />
                )}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                scrollEnabled={false}
            />
            {/* Background Section */}
            <Text style={styles.sectionTitle}>Backgrounds</Text>
            <Text style={styles.subtitle}>Customize your pet's home</Text>
            <FlatList
                data={backgroundOptions}
                renderItem={({ item }) => (
                    <BackgroundItem
                        item={item}
                        onPurchase={handlePurchase}
                        purchasedItems={purchasedItems}
                    />
                )}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContainer}
                scrollEnabled={false} // Disable scrolling since we're in a ScrollView
            />

            </ScrollView>
        </View>
    );
};

export default function ShopWrapper() {
    return (
        <PointsProvider>
            <InAppLayout>
                <Shop />
            </InAppLayout>
        </PointsProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        paddingTop: 60,
        paddingHorizontal: 16,
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
    tokenView: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    tokenContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fdff',
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#b3c2ff',
    },
    tokenText: {
        marginLeft: 6,
        fontWeight: '600',
        color: '#538ed5',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#343a40',
        marginTop: 20,
        marginBottom: 5,
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        textAlign: 'left',
    },
    listContainer: {
        paddingBottom: 20,
    },
    itemContainer: {
        flexDirection: 'row',
        borderRadius: 12,
        marginBottom: 16,
        padding: 12,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    itemPreview: {
        marginRight: 12,
    },
    backgroundPreview: {
        width: 60,
        height: 60,
        borderRadius: 8,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    itemDescription: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    priceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
    },
    priceText: {
        marginLeft: 6,
        fontWeight: '600',
        color: '#538ed5',
    },
    purchaseButton: {
        backgroundColor: '#538ed5',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    applyButton: {
        backgroundColor: '#4BB543',
    },
    disabledButton: {
        backgroundColor: '#888888',
    },
    buttonText: {
        color: 'white',
        fontWeight: '600',
    },
});
