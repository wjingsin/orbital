import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {user, useUser} from '@clerk/clerk-expo';
import {updateUserStatus} from "../firebaseService";


export default function YourComponent() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push('/home');
        }, 100); // Show for 2 seconds before navigating

        return () => clearTimeout(timer);
    }, []);


    const { user } = useUser();
    updateUserStatus(user.id, 'offline');

    // Don't return any button/Link since we're navigating automatically
    return null; // or a loading indicator if you prefer
}