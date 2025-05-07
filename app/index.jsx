import { StyleSheet, Text, View, Image, TouchableOpacity, StatusBar } from 'react-native'
import { Link } from 'expo-router'
import Logo from '../assets/pug1.png'
import React from 'react'
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-expo'
import { SignOutButton } from '../components/SignOutButton'
import { PointsProvider, usePoints } from "../contexts/PointsContext"
import Spacer from "../components/Spacer"

const Index = () => {
    const { user } = useUser()
    const { points } = usePoints()

    return (
        <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <Spacer height={70} />
            <View style={styles.logoContainer}>
                <Image source={Logo} style={[styles.logo, {borderRadius: 20}]} />
                <Text style={styles.appTitle}>Pawductivity</Text>
            </View>

            <SignedIn>
            {/*    <View style={styles.welcomeContainer}>*/}
            {/*        <Text style={styles.welcomeText}>*/}
            {/*            Welcome back,*/}
            {/*        </Text>*/}
            {/*        <Text style={styles.emailText}>*/}
            {/*            {user?.emailAddresses[0].emailAddress}*/}
            {/*        </Text>*/}
            {/*    </View>*/}

            {/*    <Spacer height={30} />*/}

                <Link href="/home" asChild>
                    <TouchableOpacity style={styles.mainButton}>
                        <Text style={styles.mainButtonText}>Continue to Home</Text>
                    </TouchableOpacity>
                </Link>

                <Spacer height={20} />

                <SignOutButton />
            </SignedIn>

            <SignedOut>
                <View style={styles.heroContainer}>
                    <Text style={styles.heroSubtitle}>
                        Achieve goals, nurture pets, connect with friends
                    </Text>
                </View>

                <Spacer height={40} />

                <Link href="/sign-in" asChild>
                    <TouchableOpacity style={styles.mainButton}>
                        <Text style={styles.mainButtonText}>Sign In</Text>
                    </TouchableOpacity>
                </Link>

                <Spacer height={20} />

                <Link href="/sign-up" asChild>
                    <TouchableOpacity style={styles.secondaryButton}>
                        <Text style={styles.secondaryButtonText}>Create Account</Text>
                    </TouchableOpacity>
                </Link>
            </SignedOut>

            <View style={styles.footer}>
                <Text style={styles.footerText}>© 2025 Pawductivity</Text>
            </View>
        </View>
    )
}

export default function IndexWrapper() {
    return (
        <PointsProvider>
            <Index />
        </PointsProvider>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    logo: {
        width: 100,
        height: 100,
        marginBottom: 10,
    },
    appTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginTop: 10,
        marginBottom: -10,
    },
    heroContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 12,
    },
    heroSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 22,
    },
    mainButton: {
        backgroundColor: '#eb7d42',
        width: '100%',
        maxWidth: 300,
        paddingVertical: 15,
        borderRadius: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    mainButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        width: '100%',
        maxWidth: 300,
        paddingVertical: 15,
        borderRadius: 10,
        borderWidth: 2,
        borderColor: '#eb7d42',
        alignItems: 'center',
    },
    secondaryButtonText: {
        color: '#eb7d42',
        fontSize: 18,
        fontWeight: '600',
    },
    welcomeContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    welcomeText: {
        fontSize: 20,
        color: '#333',
        marginBottom: 4,
    },
    emailText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    pointsCircle: {
        backgroundColor: '#eb7d42',
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 6,
        marginBottom: 30,
    },
    pointsValue: {
        color: 'white',
        fontSize: 36,
        fontWeight: 'bold',
    },
    pointsLabel: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    footer: {
        position: 'absolute',
        bottom: 20,
        width: '100%',
        alignItems: 'center',
    },
    footerText: {
        color: '#999',
        fontSize: 12,
    },
})