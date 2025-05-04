import {Keyboard, StyleSheet, Text, TextInput, TouchableWithoutFeedback, View,} from 'react-native'
import {Link} from "expo-router";
import ThemedView from '../../components/ThemedView'
import ThemedText from '../../components/ThemedText'
import Spacer from "../../components/Spacer";
import ThemedButton from "../../components/ThemedButton";
import ThemedTextInput from "../../components/ThemedTextInput";
import {useState} from "react";
import Corgi_animated from "../../components/corgi_animated";
import { useUser } from "../../hooks/useUser";
import {UserProvider} from "../../contexts/UserContext";

const login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const { login } = useUser()

    const handleSubmit = async () => {
        try {
            await login(email, password)
        } catch (error) {

        }
    }
    return (
        <UserProvider>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ThemedView style={styles.container}>
            <Spacer height={150}/>
            <ThemedText title={true} style={styles.title}>
                Log in to Your Account
            </ThemedText>

            <ThemedTextInput
                style={{ width: '80%', marginBottom: 20}}
                placeholder="Email"
                keyboardType="email-address"
                onChangeText={setEmail}
                value={email}
            />
            <ThemedTextInput
                style={{ width: '80%', marginBottom: 20}}
                placeholder="Password"
                onChangeText={setPassword}
                value={password}
                secureTextEntry
            />

            <Spacer height={10}/>
            <ThemedButton onPress={handleSubmit}>
                <Text style={{fontWeight: 'bold', color: 'white', fontSize: 20}}>Login</Text>
            </ThemedButton>
            <Spacer height={100}/>
            <Link href='/register'>
                <ThemedText style ={{ textAlign: 'center'}}>
                    Register instead
                </ThemedText>
            </Link>
            <Spacer height={25}/>
            <Link href='/'>
                <ThemedText style ={{textAlign: 'center'}}>
                    Back
                </ThemedText>
            </Link>
        </ThemedView>
        </TouchableWithoutFeedback>
            </UserProvider>

    )
}

export default login;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: {
        fontWeight: 'bold',
        fontSize: 25,
        marginBottom: 20,
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