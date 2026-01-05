import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from '../ui/Card';
import { COLORS, FONTS, SPACING } from '../../styles/theme';

interface MetricCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
    statusColor?: string;
}

export const MetricCard = ({ title, value, subtitle, icon, statusColor }: MetricCardProps) => {
    return (
        <Card style={styles.container} variant="solid">
            <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {icon}
            </View>

            <View style={styles.content}>
                <Text style={[styles.value, statusColor ? { color: statusColor } : undefined]}>
                    {value}
                </Text>
                {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        // width: 140, // Removed fixed width
        // marginRight: SPACING.m, // Removed margin
        padding: SPACING.m,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: SPACING.s,
        height: 24,
    },
    title: {
        fontFamily: FONTS.body,
        fontSize: 12,
        color: COLORS.textSecondary,
        flex: 1,
    },
    content: {
        gap: 2,
    },
    value: {
        fontFamily: FONTS.heading,
        fontSize: 20,
        color: COLORS.text,
    },
    subtitle: {
        fontFamily: FONTS.body,
        fontSize: 12,
        color: COLORS.textTertiary,
    },
});
