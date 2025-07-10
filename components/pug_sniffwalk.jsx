import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';

import pug_sniffwalk_1 from '../assets/pug_sniffwalk/pug_sniffwalk_1.png';
import pug_sniffwalk_2 from '../assets/pug_sniffwalk/pug_sniffwalk_2.png';
import pug_sniffwalk_3 from '../assets/pug_sniffwalk/pug_sniffwalk_3.png';
import pug_sniffwalk_4 from '../assets/pug_sniffwalk/pug_sniffwalk_4.png';
import pug_sniffwalk_5 from '../assets/pug_sniffwalk/pug_sniffwalk_5.png';
import pug_sniffwalk_6 from '../assets/pug_sniffwalk/pug_sniffwalk_6.png';
import pug_sniffwalk_7 from '../assets/pug_sniffwalk/pug_sniffwalk_7.png';
import pug_sniffwalk_8 from '../assets/pug_sniffwalk/pug_sniffwalk_8.png';
import pug_sniffwalk_9 from '../assets/pug_sniffwalk/pug_sniffwalk_9.png';
import pug_sniffwalk_10 from '../assets/pug_sniffwalk/pug_sniffwalk_10.png';
import pug_sniffwalk_11 from '../assets/pug_sniffwalk/pug_sniffwalk_11.png';
import pug_sniffwalk_12 from '../assets/pug_sniffwalk/pug_sniffwalk_12.png';
import pug_sniffwalk_13 from '../assets/pug_sniffwalk/pug_sniffwalk_13.png';
import pug_sniffwalk_14 from '../assets/pug_sniffwalk/pug_sniffwalk_14.png';
import pug_sniffwalk_15 from '../assets/pug_sniffwalk/pug_sniffwalk_15.png';
import pug_sniffwalk_16 from '../assets/pug_sniffwalk/pug_sniffwalk_16.png';


import Spacer from "./Spacer";

const AnimatedImage = () => {
    const images = [
        pug_sniffwalk_1, pug_sniffwalk_2, pug_sniffwalk_3, pug_sniffwalk_4,
        pug_sniffwalk_5, pug_sniffwalk_6, pug_sniffwalk_7, pug_sniffwalk_8,
        pug_sniffwalk_9, pug_sniffwalk_10, pug_sniffwalk_11, pug_sniffwalk_12,
        pug_sniffwalk_13, pug_sniffwalk_14, pug_sniffwalk_15, pug_sniffwalk_16
    ];


    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % images.length);
        }, 350);

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