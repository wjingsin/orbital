import { StyleSheet, Text, View, Image, Pressable,  TouchableOpacity, } from 'react-native'
import { Link } from 'expo-router'
import Logo from '../assets/adaptive-icon.png'
import ContactIcon from '../assets/favicon.png'
import React, { useState, useEffect } from 'react'

// themed components
import ThemedView from '../components/ThemedView'
import Spacer from "../components/Spacer";
import { PointsProvider, usePoints } from "../contexts/PointsContext";
import Corgi from "../components/corgi_animated";
import InAppLayout from "../components/InAppLayout";
import {SignOutButton} from "../components/SignOutButton";



const Home = () => {
    const { points, minusPoint } = usePoints();
    const [lastUpdate, setLastUpdate] = useState(Date.now());
    useEffect(() => {
        // This effect will make the component re-render when points change
    }, [points]);

    return (

        <View style={styles.container}>
            <Spacer height={40}/>

            <Text style={styles.header}>My Pet</Text>
            <Spacer height={10}/>
            {/*<Image source={Logo} style={styles.img}/>*/}
            <View style={styles.addTaskContainer}>
                <View style={{alignItems: 'flex-start', marginBottom: '10'}}>
                    <Text style={{marginTop: 30, fontSize: 20, marginLeft: '20'}}>
                        Happiness: 100
                    </Text>
                </View>
                <Corgi/>

                <Text style={{fontSize: '40', color: 'black', fontWeight: 300,
                    marginTop:'10', marginLeft: '20', marginBottom: '20'}}>
                    Corggi
                </Text>

            </View>
            {/*<Text style={[styles.title, {color: 'black'}]}>*/}
            {/*    Study App*/}
            {/*</Text>*/}
            {/*<Link href="/about" style={styles.link}>Abouts Page</Link>*/}
            {/*<Link href="/contact" style={styles.link}>Contacts Page</Link>*/}
            <Link href="/" style={styles.link}>Start</Link>
            {/*<Link href="/contact" asChild>*/}
            {/*    <Pressable>*/}
            {/*        <Image source={ContactIcon} style={styles.imgSmall} />*/}
            {/*    </Pressable>*/}
            {/*</Link>*/}
            <Spacer height={20}/>
            <View>
                <Text style={[styles.pointsText, {fontWeight: '400', color: 'black', fontSize: 20}]}>Treats Remaining: {points}</Text>
            </View>
            <TouchableOpacity style={styles.pointsContainer} onPress={minusPoint}>
                <Text style={styles.pointsText}>Feed Corggi a Snack!</Text>
            </TouchableOpacity>
            {/*<Text>Last updated: {new Date(lastUpdate).toLocaleTimeString()}</Text>*/}
        </View>
    )
}

export default function HomeWrapper() {
    return (
        <PointsProvider>
            <InAppLayout>
            <Home />
            </InAppLayout>
        </PointsProvider>
    );
}

const styles = StyleSheet.create({
    pointsContainer: {
        backgroundColor: '#eb7d42',
        padding: 20,
        borderRadius: 40,
        alignSelf: 'center',
        marginTop: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    nameContainer: {
        backgroundColor: '#f1efef',
        padding: 10,
        borderRadius: 10,
        alignSelf: 'flex-end',
        marginRight: 20,
    },
    pointsText: {
        color: 'white',
        fontWeight: 600,
        fontSize: 30,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
        color: '#343a40',
    },
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff'
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
    imgSmall: {
        width: 50,
        height: 50,
        margin: 20
    },
    card: {
        backgroundColor: '#eee',
        padding: 20,
        borderRadius: 5,
        boxShadow: '4px 4px rgba(0, 0, 0, 0.1)'
    },
    addTaskContainer: {
        alignItems: 'flex-start',
        backgroundColor: '#f1f1f1',
        borderRadius: 10,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    link: {
        marginVertical: 20,
        borderBottomWidth: 1
    }
})