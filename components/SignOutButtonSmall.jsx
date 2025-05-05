import { useClerk } from '@clerk/clerk-expo'
import * as Linking from 'expo-linking'
import { Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'

import React, { useState } from 'react'

export const SignOutButtonSmall = () => {
    // Use `useClerk()` to access the `signOut()` function
    const { signOut } = useClerk()
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const handleSignOut = async () => {
        try {
            await signOut()
            // Redirect to your desired page
            // Linking.openURL(Linking.createURL('afterLogout'))
            router.replace('/')
        } catch (err) {
            // See https://clerk.com/docs/custom-flows/error-handling
            // for more info on error handling
            console.error(JSON.stringify(err, null, 2))
        }
    }
    return (

        <TouchableOpacity
            style={styles.signOutButton}
            onPress={handleSignOut}
            disabled={loading}
        >
            {loading ? (
                <ActivityIndicator size="small" color="#fff" />
            ) : (
                <Text style={styles.signOutText}>Sign Out</Text>
            )}
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    signOutButton: {
        backgroundColor: '#eb7d42',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        marginVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    signOutText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 12,
    },
})
