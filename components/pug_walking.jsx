import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';

import pug_walk_1 from '../assets/pug_walk/pug_walk_1.png';
import pug_walk_2 from '../assets/pug_walk/pug_walk_2.png';
import pug_walk_3 from '../assets/pug_walk/pug_walk_3.png';
import pug_walk_4 from '../assets/pug_walk/pug_walk_4.png';
import pug_walk_5 from '../assets/pug_walk/pug_walk_5.png';
import pug_walk_6 from '../assets/pug_walk/pug_walk_6.png';
import pug_walk_7 from '../assets/pug_walk/pug_walk_7.png';
import pug_walk_8 from '../assets/pug_walk/pug_walk_8.png';
import pug_walk_9 from '../assets/pug_walk/pug_walk_9.png';
import pug_walk_10 from '../assets/pug_walk/pug_walk_10.png';
import pug_walk_11 from '../assets/pug_walk/pug_walk_11.png';
import pug_walk_12 from '../assets/pug_walk/pug_walk_12.png';
import pug_walk_13 from '../assets/pug_walk/pug_walk_13.png';
import pug_walk_14 from '../assets/pug_walk/pug_walk_14.png';
import pug_walk_15 from '../assets/pug_walk/pug_walk_15.png';
import pug_walk_16 from '../assets/pug_walk/pug_walk_16.png';
import pug_walk_17 from '../assets/pug_walk/pug_walk_17.png';
import pug_walk_18 from '../assets/pug_walk/pug_walk_18.png';
import pug_walk_19 from '../assets/pug_walk_reversed/pug_walk_1.png';
import pug_walk_20 from '../assets/pug_walk_reversed/pug_walk_2.png';
import pug_walk_21 from '../assets/pug_walk_reversed/pug_walk_3.png';
import pug_walk_22 from '../assets/pug_walk_reversed/pug_walk_4.png';
import pug_walk_23 from '../assets/pug_walk_reversed/pug_walk_5.png';
import pug_walk_24 from '../assets/pug_walk_reversed/pug_walk_6.png';
import pug_walk_25 from '../assets/pug_walk_reversed/pug_walk_7.png';
import pug_walk_26 from '../assets/pug_walk_reversed/pug_walk_8.png';
import pug_walk_27 from '../assets/pug_walk_reversed/pug_walk_9.png';
import pug_walk_28 from '../assets/pug_walk_reversed/pug_walk_10.png';
import pug_walk_29 from '../assets/pug_walk_reversed/pug_walk_11.png';
import pug_walk_30 from '../assets/pug_walk_reversed/pug_walk_12.png';
import pug_walk_31 from '../assets/pug_walk_reversed/pug_walk_13.png';
import pug_walk_32 from '../assets/pug_walk_reversed/pug_walk_14.png';
import pug_walk_33 from '../assets/pug_walk_reversed/pug_walk_15.png';
import pug_walk_34 from '../assets/pug_walk_reversed/pug_walk_16.png';
import pug_walk_35 from '../assets/pug_walk_reversed/pug_walk_17.png';
import pug_walk_36 from '../assets/pug_walk_reversed/pug_walk_18.png';


import Spacer from "./Spacer";

const AnimatedImage = () => {
    const images = [
        pug_walk_1, pug_walk_2, pug_walk_3, pug_walk_4, pug_walk_5,
        pug_walk_6, pug_walk_7, pug_walk_8, pug_walk_9, pug_walk_10,
        pug_walk_11, pug_walk_12, pug_walk_13, pug_walk_14, pug_walk_15,
        pug_walk_16, pug_walk_17, pug_walk_18,
        pug_walk_19, pug_walk_20, pug_walk_21, pug_walk_22, pug_walk_23,
        pug_walk_24, pug_walk_25, pug_walk_26, pug_walk_27, pug_walk_28,
        pug_walk_29, pug_walk_30, pug_walk_31, pug_walk_32, pug_walk_33,
        pug_walk_34, pug_walk_35, pug_walk_36
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