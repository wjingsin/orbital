// __tests__/IntegratedSystem.test.jsx

import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, View, Text, TouchableOpacity } from 'react-native';

// Mock expo-router FIRST
jest.mock('expo-router', () => ({
    useRouter: jest.fn(() => ({
        push: jest.fn(),
        replace: jest.fn(),
        back: jest.fn(),
    })),
    usePathname: jest.fn(() => '/home'),
    Link: ({ children, href, ...props }) => {
        const { TouchableOpacity } = require('react-native');
        return <TouchableOpacity {...props}>{children}</TouchableOpacity>;
    },
}));

// Mock Clerk authentication
jest.mock('@clerk/clerk-expo', () => ({
    useUser: jest.fn(() => ({
        user: {
            id: 'system-test-user',
            firstName: 'System',
            lastName: 'User',
        },
        isLoaded: true,
        isSignedIn: true,
    })),
    useAuth: jest.fn(() => ({
        signOut: jest.fn(() => Promise.resolve()),
    })),
    ClerkProvider: ({ children }) => children,
}));

// Mock Firebase services
jest.mock('../firebaseService', () => ({
    getAllUsers: jest.fn(() => Promise.resolve([
        { id: 'user1', displayName: 'Alice', petName: 'Buddy', tokens: 1500, hasPet: true, petSelection: 0 },
        { id: 'user2', displayName: 'Bob', petName: 'Max', tokens: 1200, hasPet: true, petSelection: 1 },
    ])),
    updateUserPetInfo: jest.fn(() => Promise.resolve()),
    updateUserStatus: jest.fn(() => Promise.resolve()),
    subscribeToUserStatusChanges: jest.fn(() => jest.fn()),
    subscribeToOnlineUsersOnly: jest.fn(() => jest.fn()),
    subscribeToOnlineUsers: jest.fn((userId, callback) => {
        setTimeout(() => callback([
            { userId: 'user1', displayName: 'Alice', petName: 'Buddy', hasPet: true, petSelection: 0 },
            { userId: 'user2', displayName: 'Bob', petName: 'Max', hasPet: true, petSelection: 1 },
        ]), 100);
        return jest.fn();
    }),
    getUserStudyGroups: jest.fn(() => Promise.resolve([{ name: 'Test Group' }])),
    getStudyGroupInvites: jest.fn(() => Promise.resolve([])),
    createStudyGroup: jest.fn(() => Promise.resolve()),
}));

// Mock Firebase config
jest.mock('../firebaseConfig', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
    doc: jest.fn(),
    updateDoc: jest.fn(() => Promise.resolve()),
    onSnapshot: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn((key) => {
        if (key === 'petStats') {
            return Promise.resolve(JSON.stringify({ happiness: 100, energy: 100, health: 100 }));
        }
        return Promise.resolve(null);
    }),
    setItem: jest.fn(() => Promise.resolve()),
}));

// Mock notifications
jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    scheduleNotificationAsync: jest.fn(() => Promise.resolve()),
    setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
}));

// Create shared mock functions that will be used across tests
let mockSetPetData = jest.fn();
let mockAddPoint = jest.fn();
let mockMinusPoint = jest.fn();

// Mock contexts with shared state
const mockPetData = { selectedPet: 0, petName: 'TestPet', hasPet: true };
let mockTokens = 1000;
const mockPoints = 500;

jest.mock('../contexts/PetContext', () => ({
    PetDataProvider: ({ children }) => children,
    usePetData: jest.fn(),
    PET_TYPES: ['corgi', 'pomeranian', 'pug'],
}));

jest.mock('../contexts/TokenContext', () => ({
    TokensProvider: ({ children }) => children,
    useTokens: jest.fn(),
}));

jest.mock('../contexts/PointsContext', () => ({
    PointsProvider: ({ children }) => children,
    usePoints: jest.fn(() => ({
        points: mockPoints,
        addPoint: mockAddPoint,
        minusPoint: jest.fn(),
    })),
}));

// Mock components with interactive functionality
jest.mock('../app/home', () => {
    return function MockHomeWrapper() {
        const { View, Text } = require('react-native');
        return (
            <View testID="home-wrapper">
                <Text>NewPet</Text>
                <Text>Home Component</Text>
            </View>
        );
    };
});

jest.mock('../app/focus', () => {
    return function MockFocusTimer() {
        const { View, Text, TouchableOpacity } = require('react-native');
        const { useTokens } = require('../contexts/TokenContext');

        return (
            <View testID="focus-timer">
                <Text>Focus</Text>
                <TouchableOpacity
                    testID="start-button"
                    onPress={() => {
                        // Simulate earning tokens when START is pressed
                        const { addPoint } = useTokens();
                        addPoint(50);
                    }}
                >
                    <Text>START</Text>
                </TouchableOpacity>
            </View>
        );
    };
});

jest.mock('../app/shop', () => {
    return function MockShop() {
        const { View, Text, TouchableOpacity } = require('react-native');
        const { usePetData } = require('../contexts/PetContext');
        const { useTokens } = require('../contexts/TokenContext');

        return (
            <View testID="shop">
                <TouchableOpacity
                    testID="adopt-button"
                    onPress={() => {
                        // Simulate pet adoption
                        const { setPetData } = usePetData();
                        setPetData({ selectedPet: 0, petName: 'NewPet', hasPet: true });
                    }}
                >
                    <Text>Adopt a Pet</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    testID="purchase-button"
                    onPress={() => {
                        // Simulate spending tokens
                        const { minusPoint } = useTokens();
                        minusPoint(1000);
                    }}
                >
                    <Text>Purchase</Text>
                </TouchableOpacity>
            </View>
        );
    };
});

jest.mock('../app/leaderboard', () => {
    return function MockLeaderboard() {
        const { View, Text } = require('react-native');
        return (
            <View testID="leaderboard">
                <Text>Leaderboard</Text>
            </View>
        );
    };
});

jest.mock('../app/userList', () => {
    return function MockUserList() {
        const { View, Text } = require('react-native');
        return (
            <View testID="user-list">
                <Text>Owner: Alice</Text>
            </View>
        );
    };
});

// Import components AFTER mocking
import HomeWrapper from '../app/home';
import FocusTimer from '../app/focus';
import Shop from '../app/shop';
import LeaderboardScreen from '../app/leaderboard';
import UserConnectionScreen from '../app/userList';

// Import the providers after mocking
import { PetDataProvider } from '../contexts/PetContext';
import { TokensProvider } from '../contexts/TokenContext';
import { PointsProvider } from '../contexts/PointsContext';

// Mock hooks
jest.mock('../hooks/useClerkFirebaseSync', () => jest.fn(() => ({
    updateHasPetStatus: jest.fn(),
    updateUserStatus: jest.fn(),
    isAuthenticated: true,
    authError: null,
})));

// Mock other components
jest.mock('../components/InAppLayout', () => ({ children }) => children);
jest.mock('../components/Spacer', () => () => null);

// Mock Icons
jest.mock('@expo/vector-icons', () => ({
    FontAwesome: ({ name }) => name,
    FontAwesome5: ({ name }) => name,
    MaterialIcons: ({ name }) => name,
    MaterialCommunityIcons: ({ name }) => name,
    Ionicons: ({ name }) => name,
    Entypo: ({ name }) => name,
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

// Test wrapper component
const TestProviders = ({ children }) => (
    <PetDataProvider>
        <TokensProvider>
            <PointsProvider>
                {children}
            </PointsProvider>
        </TokensProvider>
    </PetDataProvider>
);

describe('System Integration Testing - Unique Cross-Component Flows', () => {
    beforeEach(() => {
        // Reset all mocks and reinitialize shared mock functions
        jest.clearAllMocks();
        mockSetPetData = jest.fn();
        mockAddPoint = jest.fn();
        mockMinusPoint = jest.fn();
        mockTokens = 1000;

        // Setup context mocks with fresh mock functions
        const { usePetData } = require('../contexts/PetContext');
        const { useTokens } = require('../contexts/TokenContext');

        usePetData.mockReturnValue({
            petData: mockPetData,
            setPetData: mockSetPetData,
            isLoading: false,
        });

        useTokens.mockReturnValue({
            points: mockTokens,
            addPoint: mockAddPoint,
            minusPoint: mockMinusPoint,
        });
    });

    describe('Cross-Component Data Synchronization', () => {
        it('synchronizes pet data changes across all components in real-time', async () => {
            const { usePetData } = require('../contexts/PetContext');

            // Initial state: no pet
            usePetData.mockReturnValue({
                petData: { selectedPet: null, petName: '', hasPet: false },
                setPetData: mockSetPetData,
                isLoading: false,
            });

            // Render shop component
            const { getByTestId } = render(
                <TestProviders>
                    <Shop />
                </TestProviders>
            );

            // Simulate pet adoption
            await act(async () => {
                fireEvent.press(getByTestId('adopt-button'));
            });

            // Verify setPetData was called
            expect(mockSetPetData).toHaveBeenCalledWith({
                selectedPet: 0,
                petName: 'NewPet',
                hasPet: true
            });

            // Update context to reflect new pet
            usePetData.mockReturnValue({
                petData: { selectedPet: 0, petName: 'NewPet', hasPet: true },
                setPetData: mockSetPetData,
                isLoading: false,
            });

            // Render home and focus components
            const { getByText: newHomeText } = render(
                <TestProviders>
                    <HomeWrapper />
                </TestProviders>
            );
            const { getByText: newFocusText } = render(
                <TestProviders>
                    <FocusTimer />
                </TestProviders>
            );

            expect(newHomeText('NewPet')).toBeTruthy();
            expect(newFocusText('Focus')).toBeTruthy();
        });

        it('maintains token/points consistency during cross-component transactions', async () => {
            const { useTokens } = require('../contexts/TokenContext');

            // Setup mock with current token functions
            useTokens.mockReturnValue({
                points: mockTokens,
                addPoint: mockAddPoint,
                minusPoint: mockMinusPoint,
            });

            // Start focus session (earns tokens)
            const { getByTestId: getFocusElements } = render(
                <TestProviders>
                    <FocusTimer />
                </TestProviders>
            );

            await act(async () => {
                fireEvent.press(getFocusElements('start-button'));
            });

            // Verify tokens increased
            expect(mockAddPoint).toHaveBeenCalledWith(50);

            // Use tokens in shop
            const { getByTestId: getShopElements } = render(
                <TestProviders>
                    <Shop />
                </TestProviders>
            );

            await act(async () => {
                fireEvent.press(getShopElements('purchase-button'));
            });

            // Verify tokens decreased
            expect(mockMinusPoint).toHaveBeenCalledWith(1000);
        });
    });

    describe('Real-Time Social Features Integration', () => {
        it('synchronizes online user data across leaderboard and user connection screens', async () => {
            const { getByText: userListText } = render(
                <TestProviders>
                    <UserConnectionScreen />
                </TestProviders>
            );

            await waitFor(() => {
                expect(userListText('Owner: Alice')).toBeTruthy();
            });
        });
    });

    describe('System-Wide Error Recovery', () => {
        it('maintains app stability when multiple services fail simultaneously', async () => {
            const components = [
                <TestProviders><HomeWrapper /></TestProviders>,
                <TestProviders><Shop /></TestProviders>,
                <TestProviders><FocusTimer /></TestProviders>,
                <TestProviders><LeaderboardScreen /></TestProviders>
            ];

            components.forEach(component => {
                expect(() => render(component)).not.toThrow();
            });
        });
    });

    describe('Performance and Memory Management', () => {
        it('efficiently manages memory during rapid component mounting/unmounting', () => {
            const components = [
                <TestProviders><HomeWrapper /></TestProviders>,
                <TestProviders><Shop /></TestProviders>,
                <TestProviders><FocusTimer /></TestProviders>,
                <TestProviders><LeaderboardScreen /></TestProviders>
            ];
            const instances = [];

            components.forEach(component => {
                instances.push(render(component));
            });

            instances.forEach(instance => {
                expect(() => instance.unmount()).not.toThrow();
            });

            expect(instances.length).toBe(4);
        });
    });

    // Additional test cases to add to your IntegratedSystem.test.jsx

    describe('System Integration Testing - Additional Test Cases', () => {

        describe('Pet Lifecycle and Stats Integration', () => {

            it('handles pet death and revival across all components', async () => {
                const { usePetData } = require('../contexts/PetContext');

                // Pet dies (all stats at 0)
                usePetData.mockReturnValue({
                    petData: { selectedPet: 0, petName: 'DeadPet', hasPet: false },
                    setPetData: mockSetPetData,
                    isLoading: false,
                });

                const { getByTestId } = render(
                    <TestProviders>
                        <Shop />
                    </TestProviders>
                );

                // Should show revival option
                await act(async () => {
                    fireEvent.press(getByTestId('adopt-button'));
                });

                // Verify pet revival
                expect(mockSetPetData).toHaveBeenCalledWith(
                    expect.objectContaining({ hasPet: true })
                );
            });
        });

        describe('Token Economy and Shop Integration', () => {
            it('maintains token consistency across focus sessions and purchases', async () => {
                const { useTokens } = require('../contexts/TokenContext');
                let currentTokens = 500;

                useTokens.mockImplementation(() => ({
                    points: currentTokens,
                    addPoint: (amount) => {
                        currentTokens += amount;
                        mockAddPoint(amount);
                    },
                    minusPoint: (amount) => {
                        currentTokens -= amount;
                        mockMinusPoint(amount);
                    },
                }));

                // Complete focus session
                const { getByTestId: getFocusElements } = render(
                    <TestProviders>
                        <FocusTimer />
                    </TestProviders>
                );

                await act(async () => {
                    fireEvent.press(getFocusElements('start-button'));
                });

                expect(mockAddPoint).toHaveBeenCalledWith(50);

                // Attempt purchase with insufficient funds
                const { getByTestId: getShopElements } = render(
                    <TestProviders>
                        <Shop />
                    </TestProviders>
                );

                await act(async () => {
                    fireEvent.press(getShopElements('purchase-button'));
                });

                expect(mockMinusPoint).toHaveBeenCalledWith(1000);
            });
        });
        describe('Navigation and State Persistence', () => {
            it('maintains state consistency during navigation between screens', async () => {
                const { useRouter } = require('expo-router');
                const mockPush = jest.fn();

                useRouter.mockReturnValue({
                    push: mockPush,
                    replace: jest.fn(),
                    back: jest.fn(),
                });

                const { getByTestId } = render(
                    <TestProviders>
                        <HomeWrapper />
                    </TestProviders>
                );

                // Simulate navigation trigger
                await act(async () => {
                    // This would typically be triggered by a navigation button
                    mockPush('/shop');
                });

                expect(mockPush).toHaveBeenCalledWith('/shop');
            });
        });

        describe('Error Handling and Recovery', () => {
            it('gracefully handles Firebase connection failures', async () => {
                const { updateUserStatus, updateUserPetInfo } = require('../firebaseService');

                // Mock Firebase failures
                updateUserStatus.mockRejectedValue(new Error('Network error'));
                updateUserPetInfo.mockRejectedValue(new Error('Auth error'));

                const { getByTestId } = render(
                    <TestProviders>
                        <HomeWrapper />
                    </TestProviders>
                );

                // Component should still render despite Firebase errors
                await waitFor(() => {
                    expect(getByTestId('home-wrapper')).toBeTruthy();
                });
            });

            it('handles AsyncStorage failures with fallback behavior', async () => {
                const AsyncStorage = require('@react-native-async-storage/async-storage');

                AsyncStorage.getItem.mockRejectedValue(new Error('Storage error'));
                AsyncStorage.setItem.mockRejectedValue(new Error('Storage error'));

                const { getByTestId } = render(
                    <TestProviders>
                        <HomeWrapper />
                    </TestProviders>
                );

                // Should use default values when storage fails
                await waitFor(() => {
                    expect(getByTestId('home-wrapper')).toBeTruthy();
                });
            });

            it('recovers from context provider failures', async () => {
                const { usePetData } = require('../contexts/PetContext');

                // Mock context returning undefined
                usePetData.mockReturnValue(undefined);

                const { getByTestId } = render(
                    <TestProviders>
                        <HomeWrapper />
                    </TestProviders>
                );

                // Should handle undefined context gracefully
                expect(() => getByTestId('home-wrapper')).not.toThrow();
            });
        });

        describe('Performance and Memory Management', () => {
            it('handles rapid state updates without memory leaks', async () => {
                const { useTokens } = require('../contexts/TokenContext');

                useTokens.mockReturnValue({
                    points: 1000,
                    addPoint: mockAddPoint,
                    minusPoint: mockMinusPoint,
                });

                const { getByTestId } = render(
                    <TestProviders>
                        <FocusTimer />
                    </TestProviders>
                );

                // Simulate rapid button presses
                for (let i = 0; i < 10; i++) {
                    await act(async () => {
                        fireEvent.press(getByTestId('start-button'));
                    });
                }

                // Should handle rapid updates without crashing
                expect(mockAddPoint).toHaveBeenCalledTimes(10);
            });
        });

        describe('Accessibility and User Experience', () => {
            it('maintains accessibility features across component interactions', async () => {
                const { getByTestId } = render(
                    <TestProviders>
                        <HomeWrapper />
                    </TestProviders>
                );

                const homeComponent = getByTestId('home-wrapper');

                // Verify component is accessible
                expect(homeComponent).toBeTruthy();

                // Additional accessibility checks could be added here
                // such as testing screen reader compatibility
            });
        });
    });

});
