import { Pressable, StyleSheet } from 'react-native'

function ThemedButton({ style, ...props }) {

    return (
        <Pressable
            style={({ pressed }) => [styles.btn, pressed && styles.pressed, style]}
            {...props}
        />
    )
}
const styles = StyleSheet.create({
    btn: {
        backgroundColor: '#e19a50',
        borderRadius: 12,
        padding: 12,
        alignItems: 'center',
    },
    pressed: {
        opacity: 0.5
    },
})

export default ThemedButton