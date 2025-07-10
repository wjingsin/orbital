import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PointsContext = createContext();

export const PointsProvider = ({ children }) => {
    const [points, setPoints] = useState(0);
    useEffect(() => {
        const loadPoints = async () => {
            try {
                const storedPoints = await AsyncStorage.getItem('taskPoints');
                if (storedPoints !== null) {
                    setPoints(parseInt(storedPoints));
                }
            } catch (error) {
                console.error('Error loading points:', error);
            }
        };
        loadPoints();
    }, []);

    useEffect(() => {
        const savePoints = async () => {
            try {
                await AsyncStorage.setItem('taskPoints', points.toString());
            } catch (error) {
                console.error('Error saving points:', error);
            }
        };
        savePoints();
    }, [points]);

    const addPoint = (amount = 100) => {
        setPoints(prev => prev + amount);
    };

    const purchasePoint = (amount = 20) => {
        setPoints(prev => prev + amount);
    };

    const minusPoint = () => {
        setPoints(prev => Math.max(prev - 1, 0));
    };

    return (
        <PointsContext.Provider value={{ points, addPoint, minusPoint, purchasePoint }}>
            {children}
        </PointsContext.Provider>
    );
};

export const usePoints = () => {
    return useContext(PointsContext);
};