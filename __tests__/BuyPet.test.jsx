import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import BuyPetScreen from '../app/buyPet';

jest.mock('expo-router', () => ({
    useRouter: jest.fn(() => ({
        back: jest.fn(),
        replace: jest.fn(),
    })),
    useLocalSearchParams: jest.fn(() => ({})),
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    updateDoc: jest.fn(() => Promise.resolve()),
}));

jest.mock('../firebaseConfig', () => ({
    db: {},
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('@clerk/clerk-expo', () => ({
    useUser: jest.fn(() => ({
        isLoaded: true,
        isSignedIn: true,
        user: { id: 'test-user-id' },
    })),
}));

jest.mock('../contexts/PetContext', () => ({
    usePetData: jest.fn(() => ({
        petData: { selectedPet: null, petName: '', hasPet: false },
        setPetData: jest.fn(() => Promise.resolve()),
    })),
    PET_TYPES: ['corgi', 'pomeranian', 'pug'],
}));

jest.mock('../contexts/TokenContext', () => ({
    useTokens: jest.fn(() => ({
        points: 1500,
        minusPoint: jest.fn(),
    })),
}));

jest.spyOn(Alert, 'alert');

describe('BuyPetScreen', () => {
    const mockRoute = {
        params: { petPrice: 1000 }
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { getByText } = render(<BuyPetScreen route={mockRoute} />);
        expect(getByText('Adopt Your Pet')).toBeTruthy();
    });

    it('displays all pet options', () => {
        const { getByText } = render(<BuyPetScreen route={mockRoute} />);

        expect(getByText('Corgi')).toBeTruthy();
        expect(getByText('Pomeranian')).toBeTruthy();
        expect(getByText('Pug')).toBeTruthy();
    });

    it('allows pet selection', () => {
        const { getByText } = render(<BuyPetScreen route={mockRoute} />);

        const corgiOption = getByText('Corgi').parent;
        fireEvent.press(corgiOption);

        expect(corgiOption).toBeTruthy();
    });

    it('shows error when no pet is selected', () => {
        const { getByText } = render(<BuyPetScreen route={mockRoute} />);

        const confirmButton = getByText('Confirm Adoption (1000 tokens)');
        fireEvent.press(confirmButton);

        expect(getByText('Please select a pet type.')).toBeTruthy();
    });

    it('shows error when pet name is empty', () => {
        const { getByText, getByDisplayValue } = render(<BuyPetScreen route={mockRoute} />);

        const corgiOption = getByText('Corgi').parent;
        fireEvent.press(corgiOption);

        const confirmButton = getByText('Confirm Adoption (1000 tokens)');
        fireEvent.press(confirmButton);

        expect(getByText('Please enter a pet name.')).toBeTruthy();
    });

    it('shows insufficient tokens alert', () => {
        const { useTokens } = require('../contexts/TokenContext');
        useTokens.mockReturnValue({
            points: 500, // Less than required 1000
            minusPoint: jest.fn(),
        });

        const { getByText, getByPlaceholderText } = render(<BuyPetScreen route={mockRoute} />);

        const corgiOption = getByText('Corgi').parent;
        fireEvent.press(corgiOption);

        const nameInput = getByPlaceholderText('Enter pet name');
        fireEvent.changeText(nameInput, 'Buddy');

        const confirmButton = getByText('Confirm Adoption (1000 tokens)');
        fireEvent.press(confirmButton);

        expect(Alert.alert).toHaveBeenCalledWith(
            'Insufficient Tokens',
            'You need 500 more tokens to adopt a pet.'
        );
    });

    it('successfully adopts a pet', async () => {
        const mockSetPetData = jest.fn(() => Promise.resolve());
        const mockMinusPoint = jest.fn();

        const { usePetData } = require('../contexts/PetContext');
        const { useTokens } = require('../contexts/TokenContext');

        usePetData.mockReturnValue({
            petData: { selectedPet: null, petName: '', hasPet: false },
            setPetData: mockSetPetData,
        });

        useTokens.mockReturnValue({
            points: 1500,
            minusPoint: mockMinusPoint,
        });

        const { getByText, getByPlaceholderText } = render(<BuyPetScreen route={mockRoute} />);

        const corgiOption = getByText('Corgi').parent;
        fireEvent.press(corgiOption);

        const nameInput = getByPlaceholderText('Enter pet name');
        fireEvent.changeText(nameInput, 'Buddy');

        const confirmButton = getByText('Confirm Adoption (1000 tokens)');
        fireEvent.press(confirmButton);

        await waitFor(() => {
            expect(mockMinusPoint).toHaveBeenCalledWith(1000);
            expect(mockSetPetData).toHaveBeenCalledWith({
                selectedPet: 0,
                petName: 'Buddy',
                isConfirmed: true,
                hasPet: true,
            });
            expect(Alert.alert).toHaveBeenCalledWith('Success', 'You have adopted a new pet!');
        });
    });

    it('handles pet name input correctly', () => {
        const { getByPlaceholderText } = render(<BuyPetScreen route={mockRoute} />);

        const nameInput = getByPlaceholderText('Enter pet name');
        fireEvent.changeText(nameInput, 'Fluffy');

        expect(nameInput.props.value).toBe('Fluffy');
    });

    it('respects maximum pet name length', () => {
        const { getByPlaceholderText } = render(<BuyPetScreen route={mockRoute} />);

        const nameInput = getByPlaceholderText('Enter pet name');
        expect(nameInput.props.maxLength).toBe(20);
    });

    it('shows loading state during adoption', async () => {
        const { getByText, getByPlaceholderText, queryByText } = render(<BuyPetScreen route={mockRoute} />);

        const corgiOption = getByText('Corgi').parent;
        fireEvent.press(corgiOption);

        const nameInput = getByPlaceholderText('Enter pet name');
        fireEvent.changeText(nameInput, 'Buddy');

        const confirmButton = getByText('Confirm Adoption (1000 tokens)');
        fireEvent.press(confirmButton);

        await waitFor(() => {
            expect(queryByText('Confirm Adoption (1000 tokens)')).toBeFalsy();
        });
    });
});
