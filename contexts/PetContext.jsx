import { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const PetContext = createContext(null);

const PET_STORAGE_KEY = '@pet_data';

export const PET_TYPES = ['corgi', 'pomeranian', 'pug'];

export const PetProvider = ({ children }) => {
    const [petData, setPetData] = useState({
        hasPet: false,
        selectedPet: null,
        petName: '',
        isConfirmed: false,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadPetData = async () => {
            try {
                const savedPetData = await AsyncStorage.getItem(PET_STORAGE_KEY);
                if (savedPetData !== null) {
                    setPetData(JSON.parse(savedPetData));
                }
            } catch (error) {
                console.error('Failed to load pet data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadPetData();
    }, []);

    const updatePetData = async (newPetData) => {
        try {
            await AsyncStorage.setItem(PET_STORAGE_KEY, JSON.stringify(newPetData));
            setPetData(newPetData);
        } catch (error) {
            console.error('Failed to save pet data:', error);
        }
    };

    const setHasPet = async (hasPet) => {
        const updatedData = { ...petData, hasPet };
        if (!hasPet) {
            updatedData.selectedPet = null;
            updatedData.petName = '';
            updatedData.isConfirmed = false;
        }
        await updatePetData(updatedData);
    };

    return (
        <PetContext.Provider
            value={{
                petData,
                setPetData: updatePetData,
                setHasPet,
                isLoading
            }}
        >
            {children}
        </PetContext.Provider>
    );
};
export const usePetData = () => useContext(PetContext);
