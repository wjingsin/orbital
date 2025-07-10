import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Todo from '../app/todo';
import { format, startOfWeek } from 'date-fns';

jest.mock('@react-native-async-storage/async-storage', () => ({
    getItem: jest.fn(() => Promise.resolve(null)),
    setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-notifications', () => ({
    setNotificationHandler: jest.fn(),
    getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
    scheduleNotificationAsync: jest.fn(() => Promise.resolve()),
    cancelScheduledNotificationAsync: jest.fn(() => Promise.resolve()),
    setNotificationChannelAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('../contexts/PointsContext', () => ({
    PointsProvider: ({ children }) => children,
    usePoints: jest.fn(() => ({
        points: 100,
        addPoint: jest.fn(),
    })),
}));

jest.mock('../components/InAppLayout', () => ({ children }) => children);
jest.mock('../components/Spacer', () => () => null);

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

jest.mock('react-native-gesture-handler', () => ({
    GestureHandlerRootView: ({ children }) => children,
    Swipeable: ({ children }) => children,
}));

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('Todo Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { getByText } = render(<Todo />);
        expect(getByText('Tasks')).toBeTruthy();
    });

    it('displays points counter', () => {
        const { getByText } = render(<Todo />);
        expect(getByText('100')).toBeTruthy();
    });

    it('shows add task button', () => {
        const { getByText } = render(<Todo />);
        expect(getByText('+ Add New Task')).toBeTruthy();
    });

    it('opens add task form', async () => {
        const { getByText } = render(<Todo />);

        await act(async () => {
            fireEvent.press(getByText('+ Add New Task'));
        });

        expect(getByText('Add New Task')).toBeTruthy();
    });

    it('toggles task completion', async () => {
        const currentDate = new Date();
        const weekStart = format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'yyyy-MM-dd');

        const mockTasks = {
            [weekStart]: {
                Monday: [{
                    id: '1',
                    name: 'Test Task',
                    completed: false,
                    pointAwarded: false,
                    dateTime: currentDate.toISOString(),
                    color: '#ff6b6b',
                    reminderMinutes: 60
                }]
            }
        };

        AsyncStorage.getItem.mockImplementation((key) => {
            if (key === 'allTasks') {
                return Promise.resolve(JSON.stringify(mockTasks));
            }
            return Promise.resolve(null);
        });

        const { getByText } = render(<Todo />);

        await waitFor(() => {
            expect(getByText('Test Task')).toBeTruthy();
        });

        await act(async () => {
            fireEvent.press(getByText('Test Task'));
        });

        expect(AsyncStorage.setItem).toHaveBeenCalled();
    });


    it('navigates between weeks', async () => {
        const { getByText } = render(<Todo />);

        await act(async () => {
            fireEvent.press(getByText('◀'));
        });

        expect(getByText('▶')).toBeTruthy();
    });

});
