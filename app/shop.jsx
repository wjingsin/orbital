import { StyleSheet, Text, View, TouchableOpacity, FlatList, Alert, Image, ImageBackground } from 'react-native';
import React, { useState, useEffect } from 'react';
import { FontAwesome5 } from '@expo/vector-icons';
import { useTokens } from "../contexts/TokenContext";
import InAppLayout from "../components/InAppLayout";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

// Import background images
// Replace these with actual imports from your assets folder
import background1 from '../assets/living room.png';
import background2 from '../assets/living room.png';
import background3 from '../assets/living room.png'

const backgroundOptions = [
    {
        id: '1',
        name: 'Sunny Meadow',
        image: background1,
        thumbnailColor: '#a8e6cf',
        price: 1000,
        description: 'A peaceful meadow with bright sunshine',
        imageUri: require('../assets/living room.png')
    },
    {
        id: '2',
        name: 'Sunset Beach',
        image: background2,
        thumbnailColor: '#ffaaa5',
        price: 2000,
        description: 'A beautiful beach at sunset',
        imageUri: require('../assets/living room.png')
    },
    {
        id: '3',
        name: 'Starry Night',
        image: background3,
        thumbnailColor: '#3a4f6a',
        price: 3000,
        description: 'A magical night sky filled with stars',
        imageUri: require('../assets/living room.png')
    },
];

const BackgroundItem = ({ item, onPurchase, purchasedItems }) => {
    const isPurchased = purchasedItems.includes(item.id);

    return (
        <View style={[styles.itemContainer, { backgroundColor: item.thumbnailColor + '40' }]}>
            <View style={styles.itemPreview}>
                <Image
                    source={item.imageUri}
                    style={styles.backgroundPreview}
                    resizeMode="cover"
                />
            </View>

            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>

                <View style={styles.priceContainer}>
                    <FontAwesome5 name="paw" size={16} color="#28558c" />
                    <Text style={styles.priceText}>{item.price}</Text>
                </View>
            </View>

            <TouchableOpacity
                style={[
                    styles.purchaseButton,
                    isPurchased && styles.applyButton
                ]}
                onPress={() => onPurchase(item)}
            >
                <Text style={styles.buttonText}>
                    {isPurchased ? 'Apply' : 'Purchase'}
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const Shop = () => {
    const { points, minusPoint } = useTokens();
    const [purchasedItems, setPurchasedItems] = useState([]);
    const [selectedBackground, setSelectedBackground] = useState(null);

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
                // This should include the id and the key for the image
                const backgroundData = {
                    id: item.id,
                    imagePath: item.id  // We'll use the id to look up the image in Home.jsx
                };

                await AsyncStorage.setItem('selectedBackground', JSON.stringify(backgroundData));
                setSelectedBackground(backgroundData);
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
                    imagePath: item.id  // We'll use the id to look up the image in Home.jsx
                };

                await AsyncStorage.setItem('selectedBackground', JSON.stringify(backgroundData));
                setSelectedBackground(backgroundData);

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

    return (
        <InAppLayout>
            <View style={styles.container}>
                <View style={styles.header}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <FontAwesome5 name="arrow-left" size={20} color="#555" />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Background Shop</Text>
                    <View style={styles.tokenContainer}>
                        <FontAwesome5 name="coins" size={16} color="#538ed5" />
                        <Text style={styles.tokenText}>{points}</Text>
                    </View>
                </View>

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
                />
            </View>
        </InAppLayout>
    );
};

export default function ShopWrapper() {
    return (
        <Shop />
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
    subtitle: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
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
    buttonText: {
        color: 'white',
        fontWeight: '600',
    },
});