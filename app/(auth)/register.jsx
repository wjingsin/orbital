import {StyleSheet, Text, View, Pressable, Keyboard, TouchableWithoutFeedback} from 'react-native'
import {Link} from "expo-router";
import ThemedView from '../../components/ThemedView'
import ThemedText from '../../components/ThemedText'
import Spacer from "../../components/Spacer";
import ThemedButton from "../../components/ThemedButton";
import ThemedTextInput from "../../components/ThemedTextInput";
import {useState} from "react";
import {useUser} from "../../hooks/useUser";

const Register = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const { user, register } = useUser()

    const handleSubmit = async () => {
        try {
            await register(email, password)

        } catch (error) {
            console,log('crr')
        }
    }
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ThemedView style={styles.container}>
            <Spacer height={150} />
            <ThemedText title={true} style={styles.title}>
                Register For an Account
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
                <Text style={{fontWeight: 'bold', color: 'white', fontSize: 20}}>Register</Text>
            </ThemedButton>

            <Spacer height={100}/>
            <Link href='/login'>
                <ThemedText style ={{textAlign: 'center'}}>
                    Login instead
                </ThemedText>
            </Link>
            <Spacer height={50}/>
        </ThemedView>
        </TouchableWithoutFeedback>

    )
}

export default Register;

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
    },
    btn: {
        backgroundColor: 'orange',
        padding: 15,
        borderRadius: 5,
    },
    pressed: {
        opacity: 0.8
    }
})