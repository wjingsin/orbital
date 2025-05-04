import { Slot, Stack, usePathname, Link } from 'expo-router'
import {StyleSheet, Text, useColorScheme, View, Pressable, TouchableOpacity} from 'react-native'
import { Colors } from '../constants/Colors'
import { StatusBar } from 'expo-status-bar'
import ThemedView from "../components/ThemedView";
import Spacer from "../components/Spacer";
import {UserProvider} from "../contexts/UserContext";
import { ClerkProvider } from '@clerk/clerk-expo'
import { PetProvider } from '../contexts/PetContext';

import useClerkFirebaseSync from '../hooks/useClerkFirebaseSync';

const RootLayout = () => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const pathname = usePathname();
    return (
        <ClerkProvider>
            <ClerkWrappedApp/>
        </ClerkProvider>
    );
}

    const ClerkWrappedApp = () => {
        useClerkFirebaseSync();


        return (
                <PetProvider>
                <ThemedView style={{flex: 1}}>
                    <Slot />
                </ThemedView>
                </PetProvider>
        )
    }

export default RootLayout
// <Stack screenOptions={{
//     headerSyle: {backgroundColor: '#ddd'},
//     headerTintColor: '#333',
// }}>
//     <Stack.Screen name="index" options={{title: 'Home'}} />
//     <Stack.Screen name="about" options={{title: 'About'}} />
//     <Stack.Screen name="contact" options={{title: 'Contact'}} />
// </Stack>
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: {
        fontWeight: 'bold',
        fontSize: 36
    },
    img: {
        width: 200,
        height: 200,
        margin: 20
    },
    card: {
        backgroundColor: '#eee',
        padding: 20,
        borderRadius: 5,
        boxShadow: '4px 4px rgba(0, 0, 0, 0.1)'
    },
    link: {
        marginVertical: 20
    },
    layoutTop: {
        marginTop: 60,
        alignItems: 'center',
    },
    header: {
        fontSize: 28,
    },
    layoutBottom: {
        flexDirection: 'row',
        justifyContent: 'space-around', // Or 'space-between'
        alignItems: 'center',
        paddingVertical: 10,
        backgroundColor: '#ffffff',
    },

    footerButton: {
        padding: 10,
    },

    footerText: {
        fontSize: 28,
        color: 'blue',
    },
})