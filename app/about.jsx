import { StyleSheet, Text, View,  } from 'react-native'
import {Link} from "expo-router";
import ThemedView from '../components/ThemedView'

const About = () => {
    return (
        <ThemedView style={styles.container}>
            <Text style={styles.title}>About</Text>
            <Link href="/" style={styles.link}>Back Home</Link>
            <Link href="/contact" style={styles.link}>Contacts Page</Link>
        </ThemedView>

    )
}

export default About;

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