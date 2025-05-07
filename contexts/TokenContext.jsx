import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TokenContext = createContext();

export const TokensProvider = ({ children }) => {
    const [points, setPoints] = useState(0);

    // Load points from storage when app starts
    useEffect(() => {
        const loadPoints = async () => {
            try {
                const storedPoints = await AsyncStorage.getItem('tokenPoints');
                if (storedPoints !== null) {
                    setPoints(parseInt(storedPoints));
                } else {
                    // Initialize with some tokens for testing
                    setPoints(5000);
                    await AsyncStorage.setItem('tokenPoints', '5000');
                }
            } catch (error) {
                console.error('Error loading points:', error);
            }
        };
        loadPoints();
    }, []);

    // Save points to storage when they change
    useEffect(() => {
        const savePoints = async () => {
            try {
                await AsyncStorage.setItem('tokenPoints', points.toString());
            } catch (error) {
                console.error('Error saving points:', error);
            }
        };
        savePoints();
    }, [points]);

    const addPoint = (amount = 1) => {
        setPoints(prev => prev + amount);
    };

    const minusPoint = (amount = 1) => {
        setPoints(prev => Math.max(0, prev - amount));
    };

    return (
        <TokenContext.Provider value={{ points, addPoint, minusPoint }}>
            {children}
        </TokenContext.Provider>
    );
};

export const useTokens = () => {
    const context = useContext(TokenContext);
    if (!context) {
        throw new Error('useTokens must be used within a TokensProvider');
    }
    return context;
};