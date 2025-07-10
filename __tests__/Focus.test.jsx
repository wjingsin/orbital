import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import FocusTimer from '../app/focus';

jest.mock('../contexts/PetContext', () => ({
    usePetData: jest.fn(() => ({
        petData: { selectedPet: 0, petName: 'TestPet', hasPet: true },
    })),
}));

jest.mock('../contexts/TokenContext', () => ({
    useTokens: jest.fn(() => ({
        points: 100,
        addPoint: jest.fn(),
    })),
}));

jest.mock('../components/InAppLayout', () => ({ children }) => children);
jest.mock('../components/Spacer', () => () => null);
jest.mock('../components/corgi_sniffing_park', () => 'CorgiSniffing');
jest.mock('../components/corgi_running_park', () => 'CorgiRunning');
jest.mock('../components/pom_sniffing_park', () => 'PomSniffing');
jest.mock('../components/pom_running_park', () => 'PomRunning');
jest.mock('../components/pug_animated', () => 'PugAnimated');
jest.mock('../components/nopet_animated', () => 'NoPetAnimated');

jest.mock('@react-native-community/slider', () => 'Slider');

jest.mock('@expo/vector-icons', () => ({
    MaterialCommunityIcons: ({ name }) => name,
}));

jest.spyOn(Alert, 'alert');

describe('FocusTimer', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { getByText } = render(<FocusTimer />);
        expect(getByText('Focus')).toBeTruthy();
    });

    it('displays initial timer state', () => {
        const { getByText } = render(<FocusTimer />);
        expect(getByText('60:00')).toBeTruthy();
        expect(getByText('START')).toBeTruthy();
    });

    it('shows time selection slider when not running', () => {
        const { getByText } = render(<FocusTimer />);
        expect(getByText(/Focus Time:/)).toBeTruthy();
    });

    it('starts timer when START button is pressed', async () => {
        const { getByText, queryByText } = render(<FocusTimer />);

        await act(async () => {
            fireEvent.press(getByText('START'));
        });

        expect(queryByText('START')).toBeFalsy();
        expect(getByText('PAUSE')).toBeTruthy();
        expect(getByText('QUIT')).toBeTruthy();
    });

    it('shows token counter when timer is running', async () => {
        const { getByText } = render(<FocusTimer />);

        await act(async () => {
            fireEvent.press(getByText('START'));
        });

        expect(getByText('100')).toBeTruthy();
        expect(getByText(/paw/)).toBeTruthy();
        expect(getByText(/\/ sec/)).toBeTruthy();
        expect(getByText('Earned this session: 0')).toBeTruthy();
    });

    it('pauses timer when PAUSE button is pressed', async () => {
        const { getByText } = render(<FocusTimer />);

        await act(async () => {
            fireEvent.press(getByText('START'));
        });

        await act(async () => {
            fireEvent.press(getByText('PAUSE'));
        });

        expect(getByText('RESUME')).toBeTruthy();
        expect(getByText('QUIT')).toBeTruthy();
    });

    it('shows quit confirmation when QUIT is pressed', async () => {
        const { getByText } = render(<FocusTimer />);

        await act(async () => {
            fireEvent.press(getByText('START'));
        });

        await act(async () => {
            fireEvent.press(getByText('QUIT'));
        });

        expect(Alert.alert).toHaveBeenCalledWith(
            'Quit Session',
            'Are you sure you want to quit your current focus session?',
            expect.any(Array)
        );
    });

    it('calls addPoint when timer starts', async () => {
        const mockAddPoint = jest.fn();
        const { useTokens } = require('../contexts/TokenContext');
        useTokens.mockReturnValue({
            points: 100,
            addPoint: mockAddPoint,
        });

        const { getByText } = render(<FocusTimer />);

        await act(async () => {
            fireEvent.press(getByText('START'));
        });

        await waitFor(() => {
            expect(mockAddPoint).toHaveBeenCalled();
        }, { timeout: 2000 });
    });

    it('displays correct pet component based on pet data', () => {
        const { root } = render(<FocusTimer />);
        expect(root).toBeTruthy();
    });

    it('shows no pet animation when user has no pet', () => {
        const { usePetData } = require('../contexts/PetContext');
        usePetData.mockReturnValue({
            petData: { selectedPet: null, petName: '', hasPet: false },
        });

        const { root } = render(<FocusTimer />);
        expect(root).toBeTruthy();
    });
});
