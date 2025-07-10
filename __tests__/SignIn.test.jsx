import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SignInScreen from '../app/(auth)/sign-in';

jest.mock('expo-router', () => ({
    useRouter: jest.fn(() => ({
        replace: jest.fn(),
    })),
    Link: ({ children, href, ...props }) => {
        const { Text } = require('react-native');
        return <Text {...props}>{children}</Text>;
    },
}));


jest.mock('@clerk/clerk-expo', () => ({
    useSignIn: jest.fn(() => ({
        signIn: {
            create: jest.fn(() => Promise.resolve({
                status: 'complete',
                createdSessionId: 'test-session-id',
            })),
        },
        setActive: jest.fn(() => Promise.resolve()),
        isLoaded: true,
    })),
}));

describe('SignInScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { getByText } = render(<SignInScreen />);
        expect(getByText('Welcome Back')).toBeTruthy();
    });

    it('displays all form elements', () => {
        const { getByText, getByPlaceholderText } = render(<SignInScreen />);

        expect(getByText('Email')).toBeTruthy();
        expect(getByText('Password')).toBeTruthy();
        expect(getByText('Sign In')).toBeTruthy();
        expect(getByText('Sign Up')).toBeTruthy();
        expect(getByPlaceholderText('Enter your email')).toBeTruthy();
        expect(getByPlaceholderText('Enter your password')).toBeTruthy();
    });

    it('handles email input correctly', () => {
        const { getByPlaceholderText } = render(<SignInScreen />);

        const emailInput = getByPlaceholderText('Enter your email');
        fireEvent.changeText(emailInput, 'test@example.com');

        expect(emailInput.props.value).toBe('test@example.com');
    });

    it('handles password input correctly', () => {
        const { getByPlaceholderText } = render(<SignInScreen />);

        const passwordInput = getByPlaceholderText('Enter your password');
        fireEvent.changeText(passwordInput, 'password123');

        expect(passwordInput.props.value).toBe('password123');
    });

    it('shows error when sign-in fails', async () => {
        const { useSignIn } = require('@clerk/clerk-expo');
        useSignIn.mockReturnValue({
            signIn: {
                create: jest.fn(() => Promise.reject(new Error('Invalid credentials'))),
            },
            setActive: jest.fn(),
            isLoaded: true,
        });

        const { getByText, getByPlaceholderText } = render(<SignInScreen />);

        const emailInput = getByPlaceholderText('Enter your email');
        const passwordInput = getByPlaceholderText('Enter your password');
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, 'wrongpassword');

        await act(async () => {
            fireEvent.press(getByText('Sign In'));
        });

        await waitFor(() => {
            expect(getByText('Invalid email or password. Please try again.')).toBeTruthy();
        });
    });

    it('successfully signs in user', async () => {
        const mockReplace = jest.fn();
        const mockSetActive = jest.fn(() => Promise.resolve());

        const { useRouter } = require('expo-router');
        const { useSignIn } = require('@clerk/clerk-expo');

        useRouter.mockReturnValue({ replace: mockReplace });
        useSignIn.mockReturnValue({
            signIn: {
                create: jest.fn(() => Promise.resolve({
                    status: 'complete',
                    createdSessionId: 'test-session-id',
                })),
            },
            setActive: mockSetActive,
            isLoaded: true,
        });

        const { getByText, getByPlaceholderText } = render(<SignInScreen />);

        const emailInput = getByPlaceholderText('Enter your email');
        const passwordInput = getByPlaceholderText('Enter your password');
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, 'password123');

        await act(async () => {
            fireEvent.press(getByText('Sign In'));
        });

        await waitFor(() => {
            expect(mockSetActive).toHaveBeenCalledWith({ session: 'test-session-id' });
            expect(mockReplace).toHaveBeenCalledWith('/afterAugment');
        });
    });

    it('handles incomplete sign-in process', async () => {
        const { useSignIn } = require('@clerk/clerk-expo');
        useSignIn.mockReturnValue({
            signIn: {
                create: jest.fn(() => Promise.resolve({
                    status: 'needs_verification',
                })),
            },
            setActive: jest.fn(),
            isLoaded: true,
        });

        const { getByText, getByPlaceholderText } = render(<SignInScreen />);

        const emailInput = getByPlaceholderText('Enter your email');
        const passwordInput = getByPlaceholderText('Enter your password');
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, 'password123');

        await act(async () => {
            fireEvent.press(getByText('Sign In'));
        });

        await waitFor(() => {
            expect(getByText('Sign-in process incomplete. Please try again.')).toBeTruthy();
        });
    });

    it('prevents submission when not loaded', async () => {
        const { useSignIn } = require('@clerk/clerk-expo');
        const mockCreate = jest.fn();

        useSignIn.mockReturnValue({
            signIn: { create: mockCreate },
            setActive: jest.fn(),
            isLoaded: false,
        });

        const { getByText } = render(<SignInScreen />);

        await act(async () => {
            fireEvent.press(getByText('Sign In'));
        });

        expect(mockCreate).not.toHaveBeenCalled();
    });
});
