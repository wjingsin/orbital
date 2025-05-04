import React, { useState, useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';

import Img1 from '../assets/pom2.png';
import Img2 from '../assets/pom2.png';
import Img3 from '../assets/pom1.png';

const AnimatedImage = () => {
    const images = [Img1, Img2, Img3];
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setIndex((prev) => (prev + 1) % images.length);
        }, 500);

        return () => clearInterval(interval);
    }, []);

    return (
        <View style={styles.container}>
            <Image source={images[index]} style={styles.img} />
        </View>
    );
};

export default AnimatedImage;
const x = 1.5;
const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 10,
        marginRight: 10,
    },
    img: {
        width: 228 * x,
        height: 218 * x,
    },
});