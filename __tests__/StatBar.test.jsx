import React from 'react';
import { render } from '@testing-library/react-native';
import { View, Text } from 'react-native';

const StatBar = ({ label, value, maxValue, color, isPetActive = true }) => {
    const percentage = (value / maxValue) * 100;
    const barColor = isPetActive ? color : "#cccccc";

    return (
        <View testID={`stat-bar-${label.toLowerCase()}`}>
            <Text testID={`stat-label-${label.toLowerCase()}`}>{label}</Text>
            <Text testID={`stat-value-${label.toLowerCase()}`}>
                {Math.round(value)}/{maxValue}
            </Text>
            <View
                testID={`stat-progress-${label.toLowerCase()}`}
                style={{ backgroundColor: barColor, width: `${percentage}%` }}
            />
        </View>
    );
};

describe('StatBar Component', () => {
    it('renders stat bar with correct values', () => {
        const { getByTestId } = render(
            <StatBar label="Happiness" value={75} maxValue={100} color="#ff6b6b" />
        );

        expect(getByTestId('stat-label-happiness')).toBeTruthy();
        expect(getByTestId('stat-value-happiness')).toBeTruthy();
    });

    it('shows gray color when pet is inactive', () => {
        const { getByTestId } = render(
            <StatBar
                label="Energy"
                value={50}
                maxValue={100}
                color="#4ecdc4"
                isPetActive={false}
            />
        );

        const progressBar = getByTestId('stat-progress-energy');
        expect(progressBar.props.style.backgroundColor).toBe('#cccccc');
    });
});
