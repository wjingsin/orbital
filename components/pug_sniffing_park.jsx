import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';

import pug_sniffing_1 from '../assets/pug_sniff/pug_sniff_1.png';
import pug_sniffing_2 from '../assets/pug_sniff/pug_sniff_2.png';
import pug_sniffing_3 from '../assets/pug_sniff/pug_sniff_3.png';
import pug_sniffing_4 from '../assets/pug_sniff/pug_sniff_4.png';
import pug_sniffing_5 from '../assets/pug_sniff/pug_sniff_5.png';
import pug_sniffing_6 from '../assets/pug_sniff/pug_sniff_6.png';
import pug_sniffing_7 from '../assets/pug_sniff/pug_sniff_7.png';
import pug_sniffing_8 from '../assets/pug_sniff/pug_sniff_8.png';



import Spacer from "./Spacer";

const AnimatedImage = () => {
    const images = [pug_sniffing_1,
        pug_sniffing_2,
        pug_sniffing_3,
        pug_sniffing_4,
        pug_sniffing_5,
        pug_sniffing_6,
        pug_sniffing_7,
        pug_sniffing_8];

    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % images.length);
        }, 250);

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
const x = 0.55;
const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    img: {
        width: 1395 * x,
        height: 1134 * x,
        opacity: 0.6
    },
});