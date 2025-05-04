import { Slot, Stack, usePathname, Link } from 'expo-router'
import { Image, StyleSheet, Text, useColorScheme, View, Pressable, TouchableOpacity} from 'react-native'
import { Colors } from '../constants/Colors'
import { StatusBar} from 'expo-status-bar'
import ThemedView from "../components/ThemedView";
import {PointsProvider} from "../contexts/PointsContext";
import Spacer from "../components/Spacer";
import homeIcon from '../assets/corgi1.png'
import homeActiveIcon from '../assets/corgi2.png'
import todoIcon from '../assets/corgi1.png'
import todoActiveIcon from '../assets/corgi2.png'
import contactIcon from '../assets/corgi1.png'
import contactActiveIcon from '../assets/corgi2.png'


const RootLayout = ({children}) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const pathname = usePathname();

    return (
        <ThemedView style={{flex: 1}}>
            {/*<ThemedView style={styles.layoutTop}>*/}
            {/*    <Text style={styles.header}>{getHeaderTitle()}</Text>*/}
            {/*</ThemedView>*/}
            {children}
            {/*<ThemedView style={styles.layoutBottom}>*/}
            {/*    <Text style={styles.header}>stuffatthebottoms</Text>*/}
            {/*</ThemedView>*/}

            <ThemedView style={styles.layoutBottom}>
                <Link href="/todo_testpoint" asChild>
                    <Pressable>
                        <Image
                            source={pathname === "/todo_testpoint" ? todoActiveIcon : todoIcon}
                            style={styles.footerIcon}
                        />
                    </Pressable>
                </Link>

                <Link href="/home" asChild>
                    <Pressable>
                        <Image
                            source={pathname === "/home" ? homeActiveIcon : homeIcon}
                            style={styles.footerIcon}
                        />
                    </Pressable>
                </Link>

                <Link href="/contact" asChild>
                    <TouchableOpacity style={styles.footerButton}>
                        <Image
                            source={pathname === "/contact" ? contactActiveIcon : contactIcon}
                            style={styles.footerIcon}
                        />
                    </TouchableOpacity>
                </Link>

            </ThemedView>

        </ThemedView>

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
        backgroundColor: '#cacaca',
    },


    footerIcon: {
        width: 35,
        height: 35,
        resizeMode: 'contain',
        marginBottom: 10
    },
})