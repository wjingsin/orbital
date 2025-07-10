import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import {user, useUser} from '@clerk/clerk-expo';
import {updateUserStatus} from "../firebaseService";


export default function YourComponent() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push('/home');
        }, 100);

        return () => clearTimeout(timer);
    }, []);


    const { user } = useUser();
    updateUserStatus(user.id, 'offline');

    return null;
}