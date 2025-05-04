import { StyleSheet, Text, View,  } from 'react-native'
import {Link} from "expo-router";
import ThemedView from '../components/ThemedView'
import {SignOutButton} from "../components/SignOutButton";
import React from "react";
import Spacer from "../components/Spacer";

const Contact = () => {
    return (
        <ThemedView style={styles.container}>

            <View style={styles.nameContainer}>
                <SignOutButton />
            </View>
            <Spacer height={350}/>
            <Text style={styles.title}>Contact</Text>
            <Link href="/home" style={styles.link}>Back Home</Link>
            <Spacer height={350}/>
        </ThemedView>

    )
}

export default Contact;

const styles = StyleSheet.create({
    nameContainer: {
        alignSelf: 'flex-end',
        marginRight: 20,
    },
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