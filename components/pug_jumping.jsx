import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';

import pug_jump_1 from '../assets/pug_jump/pug_jump_1.png';
import pug_jump_2 from '../assets/pug_jump/pug_jump_2.png';
import pug_jump_3 from '../assets/pug_jump/pug_jump_3.png';
import pug_jump_4 from '../assets/pug_jump/pug_jump_4.png';
import pug_jump_5 from '../assets/pug_jump/pug_jump_5.png';
import pug_jump_6 from '../assets/pug_jump/pug_jump_6.png';
import pug_jump_7 from '../assets/pug_jump/pug_jump_7.png';
import pug_jump_8 from '../assets/pug_jump/pug_jump_8.png';
import pug_jump_9 from '../assets/pug_jump/pug_jump_9.png';
import pug_jump_10 from '../assets/pug_jump/pug_jump_10.png';
import pug_jump_11 from '../assets/pug_jump/pug_jump_11.png';

import pug_jump_12 from '../assets/pug_jump_reversed/pug_jump_1.png';
import pug_jump_13 from '../assets/pug_jump_reversed/pug_jump_2.png';
import pug_jump_14 from '../assets/pug_jump_reversed/pug_jump_3.png';
import pug_jump_15 from '../assets/pug_jump_reversed/pug_jump_4.png';
import pug_jump_16 from '../assets/pug_jump_reversed/pug_jump_5.png';
import pug_jump_17 from '../assets/pug_jump_reversed/pug_jump_6.png';
import pug_jump_18 from '../assets/pug_jump_reversed/pug_jump_7.png';
import pug_jump_19 from '../assets/pug_jump_reversed/pug_jump_8.png';
import pug_jump_20 from '../assets/pug_jump_reversed/pug_jump_9.png';
import pug_jump_21 from '../assets/pug_jump_reversed/pug_jump_10.png';
import pug_jump_22 from '../assets/pug_jump_reversed/pug_jump_11.png';
import Spacer from "./Spacer";

const AnimatedImage = () => {
    const images = [
        pug_jump_1, pug_jump_2, pug_jump_3, pug_jump_4, pug_jump_5,
        pug_jump_6, pug_jump_7, pug_jump_8, pug_jump_9, pug_jump_10,
        pug_jump_11, pug_jump_12, pug_jump_13, pug_jump_14, pug_jump_15,
        pug_jump_16, pug_jump_17, pug_jump_18, pug_jump_19, pug_jump_20,
        pug_jump_21, pug_jump_22
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