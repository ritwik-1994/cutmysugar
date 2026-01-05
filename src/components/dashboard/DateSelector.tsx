import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS } from '../../styles/theme';

interface DateSelectorProps {
    selectedDate: Date;
    onSelectDate: (date: Date) => void;
}

export const DateSelector = ({ selectedDate, onSelectDate }: DateSelectorProps) => {
    // Generate last 14 days including today
    const dates = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return d;
    });

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const isToday = (d: Date) => {
        const today = new Date();
        return isSameDay(d, today);
    };

    const scrollViewRef = React.useRef<ScrollView>(null);

    return (
        <View style={styles.container}>
            <ScrollView
                ref={scrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: false })}
            >
                {dates.map((date, index) => {
                    const isSelected = isSameDay(date, selectedDate);
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNumber = date.getDate();

                    return (
                        <TouchableOpacity
                            key={index}
                            onPress={() => onSelectDate(date)}
                            activeOpacity={0.7}
                            style={[
                                styles.dateItem,
                                isSelected && styles.selectedItem,
                            ]}
                        >
                            <Text style={[
                                styles.dayName,
                                isSelected && styles.selectedText
                            ]}>
                                {dayName}
                            </Text>
                            <View style={[
                                styles.dayNumberContainer,
                                isSelected && styles.selectedNumberContainer
                            ]}>
                                <Text style={[
                                    styles.dayNumber,
                                    isSelected && styles.selectedText
                                ]}>
                                    {dayNumber}
                                </Text>
                            </View>
                            {isToday(date) && !isSelected && (
                                <View style={styles.todayDot} />
                            )}
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.l,
    },
    scrollContent: {
        paddingHorizontal: SPACING.l,
        gap: SPACING.s,
    },
    dateItem: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: SPACING.s,
        paddingHorizontal: 12,
        borderRadius: SIZES.borderRadius.m,
        backgroundColor: 'transparent',
        minWidth: 50,
    },
    selectedItem: {
        backgroundColor: COLORS.brand.primary,
        ...SHADOWS.light,
    },
    dayName: {
        fontFamily: FONTS.body,
        fontSize: 12,
        color: COLORS.textSecondary,
        marginBottom: 4,
    },
    dayNumberContainer: {
        width: 28,
        height: 28,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedNumberContainer: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
    dayNumber: {
        fontFamily: FONTS.heading,
        fontSize: 16,
        color: COLORS.text,
    },
    selectedText: {
        color: '#FFFFFF',
    },
    todayDot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: COLORS.brand.accent,
        marginTop: 4,
    },
});
