jest.mock('firebase/firestore', () => ({
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(() => Promise.resolve({
        exists: () => true,
        data: () => ({})
    })),
    setDoc: jest.fn(() => Promise.resolve()),
    updateDoc: jest.fn(() => Promise.resolve()),
    deleteDoc: jest.fn(() => Promise.resolve()),
    addDoc: jest.fn(() => Promise.resolve({ id: 'mock-id' })),
    getDocs: jest.fn(() => Promise.resolve({ docs: [] })),
    query: jest.fn(),
    where: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
}));

jest.mock('firebase/app', () => ({
    initializeApp: jest.fn(),
    getApps: jest.fn(() => []),
    getApp: jest.fn(),
}));



jest.mock('./firebaseConfig', () => ({
    db: {},
    auth: {},
}));

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-router', () => ({
    Link: ({ children, href, ...props }) => {
        const { Text } = require('react-native');
        return <Text {...props}>{children}</Text>;
    },
}));

const originalError = console.error;
beforeAll(() => {
    console.error = (...args) => {
        return;
    };
});
afterEach(() => {
    if (jest.isMockFunction(setTimeout)) {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    }
    jest.clearAllMocks();
});

beforeEach(() => {
    jest.useFakeTimers();
});
