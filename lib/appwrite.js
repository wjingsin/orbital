import { Client, Account, Avatars } from 'react-native-appwrite';

export const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('6815e1570004b1e78089')

export const account = new Account(client)
export const avatars = new Avatars(client)

