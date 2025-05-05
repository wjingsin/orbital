import { Slot, Stack, usePathname, Link } from 'expo-router'
import { StyleSheet, Text, useColorScheme, View, Pressable, TouchableOpacity } from 'react-native'
import { Colors } from '../constants/Colors'
import { StatusBar } from 'expo-status-bar'
import ThemedView from "../components/ThemedView";
import { PointsProvider } from "../contexts/PointsContext";
import Spacer from "../components/Spacer";
import { FontAwesome } from '@expo/vector-icons';

const RootLayout = ({ children }) => {
    const colorScheme = useColorScheme()
    const theme = Colors[colorScheme] ?? Colors.light
    const pathname = usePathname();

    // Define the active and inactive colors for the icons
    const activeColor = '#dc8d51'; // Changed from theme.tint to orange
    const inactiveColor = theme.tabIconDefault || '#cac8c3';

    return (
        <ThemedView style={{ flex: 1 }}>
            {children}

            <ThemedView style={styles.layoutBottom}>
                <Link href="/todo" asChild>
                    <Pressable style={styles.footerItem}>
                        <FontAwesome
                            name="tasks"
                            size={26}
                            color={pathname === "/todo" ? activeColor : inactiveColor}
                        />
                    </Pressable>
                </Link>

                <Link href="/home" asChild>
                    <Pressable style={styles.footerItem}>
                        <FontAwesome
                            name="paw"
                            size={26}
                            color={pathname === "/home" ? activeColor : inactiveColor}
                        />
                    </Pressable>
                </Link>

                <Link href="/userList" asChild>
                    <TouchableOpacity style={styles.footerItem}>
                        <FontAwesome
                            name="users"
                            size={26}
                            color={pathname === "/userList" ? activeColor : inactiveColor}
                        />
                    </TouchableOpacity>
                </Link>
            </ThemedView>
        </ThemedView>
    )
}

export default RootLayout

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
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 12,
        paddingBottom: 25,
        backgroundColor: '#fafafa',
    },
    footerItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 5,
    }
})