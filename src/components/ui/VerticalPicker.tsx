import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, NativeSyntheticEvent, NativeScrollEvent, Platform, Vibration } from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, FONTS, SPACING } from '../../styles/theme';

interface VerticalPickerProps {
    data: string[];
    value: string;
    onValueChange: (val: string) => void;
    label?: string; // e.g. "ft", "cm"
    height?: number;
    itemHeight?: number;
}

export const VerticalPicker = ({
    data,
    value,
    onValueChange,
    label,
    height = 200,
    itemHeight = 50
}: VerticalPickerProps) => {
    // 1. Prepare data with padding for center snap
    // We need (height/2 - itemHeight/2) padding at top and bottom so the first/last items can be centered.
    const padding = (height - itemHeight) / 2;

    const flatListRef = useRef<FlatList>(null);
    const [selectedIndex, setSelectedIndex] = useState(0);

    // Initial Scroll
    useEffect(() => {
        const index = data.indexOf(value);
        if (index >= 0) {
            setSelectedIndex(index);
            // Slight delay to ensure layout is ready
            setTimeout(() => {
                flatListRef.current?.scrollToOffset({
                    offset: index * itemHeight,
                    animated: false
                });
            }, 100);
        }
    }, []);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const rawIndex = offsetY / itemHeight;
        const index = Math.round(rawIndex);

        // Clamp index
        const clampedIndex = Math.max(0, Math.min(index, data.length - 1));

        if (clampedIndex !== selectedIndex) {
            setSelectedIndex(clampedIndex);

            // Haptic Feedback
            if (Platform.OS !== 'web') {
                Haptics.selectionAsync();
            }
        }
    };

    const handleMomentumScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const offsetY = event.nativeEvent.contentOffset.y;
        const index = Math.round(offsetY / itemHeight);
        const clampedIndex = Math.max(0, Math.min(index, data.length - 1));

        const newValue = data[clampedIndex];
        if (newValue !== value) {
            onValueChange(newValue);
        }
    };

    return (
        <View style={[styles.container, { height }]}>
            {/* Center Highlight Bar (The "Selection Zone") */}
            <View style={[
                styles.highlightBar,
                {
                    top: padding,
                    height: itemHeight
                }
            ]} pointerEvents="none" />

            {/* List */}
            <FlatList
                ref={flatListRef}
                data={data}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                snapToInterval={itemHeight}
                decelerationRate="fast"
                contentContainerStyle={{
                    paddingVertical: padding,
                    paddingHorizontal: SPACING.m
                }}
                onScroll={handleScroll}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                scrollEventThrottle={16} // High freq events for smoothness
                getItemLayout={(_, index) => ({
                    length: itemHeight,
                    offset: itemHeight * index,
                    index,
                })}
                renderItem={({ item, index }) => {
                    const isSelected = index === selectedIndex;
                    return (
                        <View style={[styles.item, { height: itemHeight }]}>
                            <Text style={[
                                styles.itemText,
                                isSelected ? styles.selectedText : styles.unselectedText
                            ]}>
                                {item}
                                {isSelected && label && <Text style={styles.unitVideo}> {label}</Text>}
                            </Text>
                        </View>
                    );
                }}
            />

            {/* Top Fade Gradient */}
            <LinearGradient
                colors={[COLORS.surface, 'transparent']}
                style={[styles.gradient, { top: 0, height: padding }]}
                pointerEvents="none"
            />
            {/* Bottom Fade Gradient */}
            <LinearGradient
                colors={['transparent', COLORS.surface]}
                style={[styles.gradient, { bottom: 0, height: padding }]}
                pointerEvents="none"
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 16,
        overflow: 'hidden',
        width: '100%',
        position: 'relative',
        borderWidth: 1,
        borderColor: COLORS.surfaceLight
    },
    highlightBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        backgroundColor: COLORS.surfaceLight, // Subtle highlight background
        zIndex: -1,
    },
    gradient: {
        position: 'absolute',
        left: 0,
        right: 0,
        zIndex: 10,
    },
    item: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemText: {
        fontFamily: FONTS.heading,
        fontSize: 24,
    },
    selectedText: {
        color: COLORS.text,
        transform: [{ scale: 1.1 }]
    },
    unselectedText: {
        color: COLORS.textTertiary,
        fontSize: 20,
    },
    unitVideo: {
        fontSize: 16,
        fontFamily: FONTS.medium,
        color: COLORS.brand.primary // Highlight the unit
    }
});
