import { TextInput, useColorScheme } from 'react-native'
import { Colors } from '../constants/Colors'

export default function ThemedTextInput({ style, ...props }) {
    return (
        <TextInput
            style={[
                {
                    backgroundColor: '#c3c3c3',
                    color: '#000000',
                    padding: 20,
                    borderRadius: 10,
                },
                style
            ]}
            {...props}
        />
    )
}