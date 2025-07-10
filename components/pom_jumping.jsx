import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';

import pom_jump_1 from '../assets/pom_jump/pom_jump_1.png';
import pom_jump_2 from '../assets/pom_jump/pom_jump_2.png';
import pom_jump_3 from '../assets/pom_jump/pom_jump_3.png';
import pom_jump_4 from '../assets/pom_jump/pom_jump_4.png';
import pom_jump_5 from '../assets/pom_jump/pom_jump_5.png';
import pom_jump_6 from '../assets/pom_jump/pom_jump_6.png';
import pom_jump_7 from '../assets/pom_jump/pom_jump_7.png';
import pom_jump_8 from '../assets/pom_jump/pom_jump_8.png';
import pom_jump_9 from '../assets/pom_jump/pom_jump_9.png';
import pom_jump_10 from '../assets/pom_jump/pom_jump_10.png';
import pom_jump_11 from '../assets/pom_jump_reverse/pom_jump_1.png';
import pom_jump_12 from '../assets/pom_jump_reverse/pom_jump_2.png';
import pom_jump_13 from '../assets/pom_jump_reverse/pom_jump_3.png';
import pom_jump_14 from '../assets/pom_jump_reverse/pom_jump_4.png';
import pom_jump_15 from '../assets/pom_jump_reverse/pom_jump_5.png';
import pom_jump_16 from '../assets/pom_jump_reverse/pom_jump_6.png';
import pom_jump_17 from '../assets/pom_jump_reverse/pom_jump_7.png';
import pom_jump_18 from '../assets/pom_jump_reverse/pom_jump_8.png';
import pom_jump_19 from '../assets/pom_jump_reverse/pom_jump_9.png';
import pom_jump_20 from '../assets/pom_jump_reverse/pom_jump_10.png';

import Spacer from "./Spacer";

const AnimatedImage = () => {
    const images = [
        pom_jump_1, pom_jump_2, pom_jump_3, pom_jump_4, pom_jump_5,
        pom_jump_6, pom_jump_7, pom_jump_8, pom_jump_9, pom_jump_10,
        pom_jump_11, pom_jump_12, pom_jump_13, pom_jump_14, pom_jump_15,
        pom_jump_16, pom_jump_17, pom_jump_18, pom_jump_19, pom_jump_20
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