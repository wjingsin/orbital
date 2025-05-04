// firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCbPp51jdvmZ6tJqt175OaP8v8JAzDUii4",
    authDomain: "untitled2-1aac1.firebaseapp.com",
    projectId: "untitled2-1aac1",
    storageBucket: "untitled2-1aac1.firebasestorage.app",
    messagingSenderId: "88317258788",
    appId: "1:88317258788:web:3c768479b11b67c8543cb1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { app, db, storage };