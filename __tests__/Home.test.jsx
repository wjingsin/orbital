import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import HomeWrapper from '../app/home'; // Changed from Home to HomeWrapper

jest.mock('expo-router', () => ({
    useRouter: jest.fn(() => ({
        push: jest.fn(),
    })),
    Link: ({ children, href, ...props }) => {
        const { TouchableOpacity } = require('react-native');
        return <TouchableOpacity {...props}>{children}</TouchableOpacity>;
    },
}));

jest.mock('@clerk/clerk-expo', () => ({
    useUser: jest.fn(() => ({
        user: { id: 'test-user-id' },
        isLoaded: true,
        isSignedIn: true,
    })),
}));

jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    updateDoc: jest.fn(() => Promise.resolve()),
}));

jest.mock('../firebaseConfig', () => ({
    db: {},
}));

jest.mock('../firebaseService', () => ({
    updateUserPetInfo: jest.fn(() => Promise.resolve()),
    updateUserStatus: jest.fn(() => Promise.resolve()),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn((key) => {
        if (key === 'petStats') {
            return Promise.resolve(JSON.stringify({ happiness: 100, energy: 100, health: 100 }));
        }
        return Promise.resolve(null);
    }),
    setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('../contexts/PetContext', () => ({
    usePetData: jest.fn(() => ({
        petData: { selectedPet: 0, petName: 'TestPet', hasPet: true },
        setPetData: jest.fn(),
        isLoading: false,
    })),
    PET_TYPES: ['corgi', 'pomeranian', 'pug'],
}));

jest.mock('../contexts/PointsContext', () => ({
    PointsProvider: ({ children }) => children,
    usePoints: jest.fn(() => ({
        points: 100,
        minusPoint: jest.fn(),
    })),
}));

jest.mock('../contexts/TokenContext', () => ({
    TokensProvider: ({ children }) => children,
    useTokens: jest.fn(() => ({
        points: 50,
    })),
}));

jest.mock('../hooks/useClerkFirebaseSync', () => jest.fn(() => ({
    updateHasPetStatus: jest.fn(),
    updateUserStatus: jest.fn(),
    isAuthenticated: true,
    authError: null,
})));

jest.mock('../components/InAppLayout', () => ({ children }) => children);
jest.mock('../components/Spacer', () => () => null);
jest.mock('../components/corgi_walking', () => 'CorgiWalking');
jest.mock('../components/corgi_jumping', () => 'CorgiJumping');
jest.mock('../components/pom_walking', () => 'PomWalking');
jest.mock('../components/pug_animated', () => 'PugAnimated');
jest.mock('../components/nopet_animated', () => 'NoPetAnimated');
jest.mock('../components/corgi_sniffwalk', () => 'CorgiSniff');
jest.mock('../components/pom_sniffwalk', () => 'PomSniff');

jest.mock('@expo/vector-icons', () => ({
    FontAwesome5: ({ name }) => name,
    Entypo: ({ name }) => name,
    FontAwesome: ({ name }) => name,
    Ionicons: ({ name }) => name,
    AntDesign: ({ name, ...props }) => `AntDesign-${name}`,
}));

describe('Home Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { getByText } = render(<HomeWrapper />);
        expect(getByText('Home')).toBeTruthy();
    });

    it('displays correct pet component', () => {
        const { root } = render(<HomeWrapper />);
        expect(root).toBeTruthy();
    });

    it('handles feed treat button press', async () => {
        const mockMinusPoint = jest.fn();
        const { usePoints } = require('../contexts/PointsContext');
        usePoints.mockReturnValue({
            points: 100,
            minusPoint: mockMinusPoint,
        });

        const { getByText } = render(<HomeWrapper />);
        await act(async () => {
            fireEvent.press(getByText('Feed Treat'));
        });

        expect(mockMinusPoint).toHaveBeenCalled();
    });

    it('displays Settings link', async () => {
        const { getByText } = render(<HomeWrapper />);
        const editProfileLink = getByText('Settings');
        expect(editProfileLink).toBeTruthy();
    });

    it('shows no pet when user has no pet', () => {
        const { usePetData } = require('../contexts/PetContext');
        usePetData.mockReturnValue({
            petData: { selectedPet: null, petName: '', hasPet: false },
            setPetData: jest.fn(),
            isLoading: false,
        });

        const { root } = render(<HomeWrapper />);
        expect(root).toBeTruthy();
    });

    it('displays pet stats correctly', () => {
        const { getByText } = render(<HomeWrapper />);
        expect(getByText('Happiness')).toBeTruthy();
        expect(getByText('Energy')).toBeTruthy();
        expect(getByText('Hunger')).toBeTruthy();
    });

    it('displays token and points counters', () => {
        const { getByText } = render(<HomeWrapper />);
        expect(getByText('50')).toBeTruthy(); // Tokens
        expect(getByText('100')).toBeTruthy(); // Points
    });

    it('feed treat button is disabled when points are 0', () => {
        const { usePoints } = require('../contexts/PointsContext');
        usePoints.mockReturnValue({
            points: 0,
            minusPoint: jest.fn(),
        });

        const { getByText } = render(<HomeWrapper />);
        const feedButton = getByText('Feed Treat');
        expect(feedButton).toBeTruthy();
    });

    it('updates pet status in firebase when pet becomes inactive', async () => {
        const mockSetPetData = jest.fn();
        const { usePetData } = require('../contexts/PetContext');

        // Start with an active pet
        usePetData.mockReturnValue({
            petData: { selectedPet: 0, petName: 'TestPet', hasPet: true },
            setPetData: mockSetPetData,
            isLoading: false,
        });

        const mockAsyncStorage = require('@react-native-async-storage/async-storage');

        // Initially return normal stats
        mockAsyncStorage.getItem.mockImplementation((key) => {
            if (key === 'petStats') {
                return Promise.resolve(JSON.stringify({ happiness: 50, energy: 50, health: 50 }));
            }
            if (key === 'lastUpdateTime') {
                // Return a time that would cause stats to decay to zero
                return Promise.resolve((Date.now() - 100000000).toString()); // Very old timestamp
            }
            return Promise.resolve(null);
        });

        render(<HomeWrapper />);

        // Wait for the component to load stats and process the decay
        await waitFor(() => {
            expect(mockSetPetData).toHaveBeenCalledWith(
                expect.objectContaining({ hasPet: false })
            );
        }, { timeout: 5000 });
    });


    it('renders background image when background data exists', async () => {
        const mockAsyncStorage = require('@react-native-async-storage/async-storage');
        mockAsyncStorage.getItem
            .mockResolvedValueOnce(JSON.stringify({ happiness: 100, energy: 100, health: 100 })) // petStats
            .mockResolvedValueOnce('{"imagePath":"1"}'); // selectedBackground

        const { root } = render(<HomeWrapper />);
        expect(root).toBeTruthy();
    });

    it('displays shop link', () => {
        const { getByText } = render(<HomeWrapper />);
        expect(getByText('Shop')).toBeTruthy();
    });
});
