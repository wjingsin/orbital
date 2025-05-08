import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';

import corgi_jump_1 from '../assets/corgi_jump/corg_jumping_1.png';
import corgi_jump_2 from '../assets/corgi_jump/corg_jumping_2.png';
import corgi_jump_3 from '../assets/corgi_jump/corg_jumping_3.png';
import corgi_jump_4 from '../assets/corgi_jump/corg_jumping_4.png';
import corgi_jump_5 from '../assets/corgi_jump/corg_jumping_5.png';
import corgi_jump_6 from '../assets/corgi_jump/corg_jumping_6.png';
import corgi_jump_7 from '../assets/corgi_jump/corg_jumping_7.png';
import corgi_jump_8 from '../assets/corgi_jump/corg_jumping_8.png';
import corgi_jump_9 from '../assets/corgi_jump/corg_jumping_9.png';
import corgi_jump_10 from '../assets/corgi_jump/corg_jumping_10.png';
import corgi_jump_11 from '../assets/corgi_jump/corg_jumping_11.png';

import corgi_jump_12 from '../assets/corgi_jump/reverse/corg_jumping_1.png';
import corgi_jump_13 from '../assets/corgi_jump/reverse/corg_jumping_2.png';
import corgi_jump_14 from '../assets/corgi_jump/reverse/corg_jumping_3.png';
import corgi_jump_15 from '../assets/corgi_jump/reverse/corg_jumping_4.png';
import corgi_jump_16 from '../assets/corgi_jump/reverse/corg_jumping_5.png';
import corgi_jump_17 from '../assets/corgi_jump/reverse/corg_jumping_6.png';
import corgi_jump_18 from '../assets/corgi_jump/reverse/corg_jumping_7.png';
import corgi_jump_19 from '../assets/corgi_jump/reverse/corg_jumping_8.png';
import corgi_jump_20 from '../assets/corgi_jump/reverse/corg_jumping_9.png';
import corgi_jump_21 from '../assets/corgi_jump/reverse/corg_jumping_10.png';
import corgi_jump_22 from '../assets/corgi_jump/reverse/corg_jumping_11.png';
import Spacer from "./Spacer";

const AnimatedImage = () => {
    const images = [corgi_jump_12, corgi_jump_13, corgi_jump_14, corgi_jump_15, corgi_jump_16, corgi_jump_17, corgi_jump_18,
        corgi_jump_19, corgi_jump_20, corgi_jump_21, corgi_jump_22, corgi_jump_1, corgi_jump_2, corgi_jump_3, corgi_jump_4,
        corgi_jump_5, corgi_jump_6, corgi_jump_7, corgi_jump_8, corgi_jump_9, corgi_jump_10, corgi_jump_11
    ];

    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % images.length);
        }, 150);

        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.container}>
            <Image source={images[index]} style={styles.img} />
            <Spacer height={20} />
        </View>
    );
};

export default AnimatedImage;
const x = 0.265;
const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    img: {
        width: 1395 * x,
        height: 1134 * x,
    },
});