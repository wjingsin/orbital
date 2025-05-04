import { StyleSheet, Text, View,  } from 'react-native'
import {Link} from "expo-router";
import ThemedView from '../components/ThemedView'

const AfterLogout = () => {
    return (
        <ThemedView style={styles.container}>
            <Text style={styles.title}>Come back again!</Text>
            <Link href="/sign-in" style={styles.link}>Login</Link>
        </ThemedView>

    )
}

export default AfterLogout;

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
    }
})