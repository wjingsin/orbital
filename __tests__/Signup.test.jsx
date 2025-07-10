import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert } from 'react-native';
import SignUpScreen from '../app/(auth)/sign-up';

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
    useSignUp: jest.fn(() => ({
        signUp: {
            create: jest.fn(() => Promise.resolve()),
            prepareEmailAddressVerification: jest.fn(() => Promise.resolve()),
            attemptEmailAddressVerification: jest.fn(() => Promise.resolve({
                status: 'complete',
                createdSessionId: 'test-session-id',
            })),
        },
        setActive: jest.fn(() => Promise.resolve()),
        isLoaded: true,
    })),
}));

describe('SignUpScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders without crashing', () => {
        const { getByText } = render(<SignUpScreen />);
        expect(getByText('Create Account')).toBeTruthy();
    });

    it('displays all form elements', () => {
        const { getByText, getByPlaceholderText } = render(<SignUpScreen />);

        expect(getByText('Email')).toBeTruthy();
        expect(getByText('Password')).toBeTruthy();
        expect(getByText('Sign Up')).toBeTruthy();
        expect(getByText('Sign In')).toBeTruthy();
        expect(getByPlaceholderText('Enter your email')).toBeTruthy();
        expect(getByPlaceholderText('Create a password')).toBeTruthy();
    });

    it('handles email input correctly', () => {
        const { getByPlaceholderText } = render(<SignUpScreen />);

        const emailInput = getByPlaceholderText('Enter your email');
        fireEvent.changeText(emailInput, 'test@example.com');

        expect(emailInput.props.value).toBe('test@example.com');
    });

    it('handles password input correctly', () => {
        const { getByPlaceholderText } = render(<SignUpScreen />);

        const passwordInput = getByPlaceholderText('Create a password');
        fireEvent.changeText(passwordInput, 'password123');

        expect(passwordInput.props.value).toBe('password123');
    });

    it('shows error when sign-up fails', async () => {
        const { useSignUp } = require('@clerk/clerk-expo');
        useSignUp.mockReturnValue({
            signUp: {
                create: jest.fn(() => Promise.reject(new Error('Email already exists'))),
                prepareEmailAddressVerification: jest.fn(),
                attemptEmailAddressVerification: jest.fn(),
            },
            setActive: jest.fn(),
            isLoaded: true,
        });

        const { getByText, getByPlaceholderText } = render(<SignUpScreen />);

        const emailInput = getByPlaceholderText('Enter your email');
        const passwordInput = getByPlaceholderText('Create a password');
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, 'password123');

        await act(async () => {
            fireEvent.press(getByText('Sign Up'));
        });

        await waitFor(() => {
            expect(getByText(/Registration failed/)).toBeTruthy();
        });
    });

    it('successfully creates account and shows verification form', async () => {
        const mockCreate = jest.fn(() => Promise.resolve());
        const mockPrepareVerification = jest.fn(() => Promise.resolve());

        const { useSignUp } = require('@clerk/clerk-expo');
        useSignUp.mockReturnValue({
            signUp: {
                create: mockCreate,
                prepareEmailAddressVerification: mockPrepareVerification,
                attemptEmailAddressVerification: jest.fn(),
            },
            setActive: jest.fn(),
            isLoaded: true,
        });

        const { getByText, getByPlaceholderText } = render(<SignUpScreen />);

        const emailInput = getByPlaceholderText('Enter your email');
        const passwordInput = getByPlaceholderText('Create a password');
        fireEvent.changeText(emailInput, 'test@example.com');
        fireEvent.changeText(passwordInput, 'password123');

        await act(async () => {
            fireEvent.press(getByText('Sign Up'));
        });

        await waitFor(() => {
            expect(mockCreate).toHaveBeenCalledWith({
                emailAddress: 'test@example.com',
                password: 'password123',
            });
            expect(mockPrepareVerification).toHaveBeenCalledWith({ strategy: 'email_code' });
            expect(getByText('Verify Your Email')).toBeTruthy();
        });
    });

});
