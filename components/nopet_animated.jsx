import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const NoPetPlaceholder = () => {
    return (
        <View style={styles.container}>
            <View style={styles.placeholderBox}>
                <MaterialIcons name="pets" size={80} color="#cccccc" />
                <Text style={styles.placeholderText}>You do not have a pet.</Text>
                <Text style={styles.placeholderText}>Go to the token shop to purchase one</Text>
            </View>
        </View>
    );
};

export default NoPetPlaceholder;

const x = 0.7;
const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
        marginRight: 10,
    },
    placeholderBox: {
        width: 555 * x,
        height: 489 * x,
        borderRadius: 5,
        backgroundColor: '#f5f5f5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    placeholderText: {
        marginTop: 15,
        fontSize: 18,
        color: '#888888',
        fontWeight: '500',
    }
});
