import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS, FONTS, SHADOWS, SPACING, SIZES } from '../../styles/theme';
import { CircularProgress } from '../ui/CircularProgress';

interface PendingMealItemProps {
    action: {
        id: string;
        type: 'image' | 'text' | 'barcode' | 'scan' | 'refine';
        status: 'uploading' | 'analyzing' | 'separating' | 'calculating' | 'finalizing' | 'failed';
        progress: number;
        label: string;
        imageUri?: string;
    };
}

export const PendingMealItem: React.FC<PendingMealItemProps> = ({ action }) => {
    const [localProgress, setLocalProgress] = useState(0);

    useEffect(() => {
        let interval: NodeJS.Timeout;

        if (action.status === 'failed') {
            setLocalProgress(0);
            return;
        }

        // Start from current localProgress (or 0) and aim for 95%
        // We ignore action.progress for the animation to prevent jumps, 
        // using it only if we wanted to sync rough stages, but "smooth to 95%" is the key requirement.

        interval = setInterval(() => {
            setLocalProgress(prev => {
                const target = 95;
                if (prev >= target) return target;

                // Smooth increments (50Hz / 20ms)
                // Adjust speeds to feel natural for a 5-10s process
                if (prev < 30) return prev + 0.8;
                if (prev < 60) return prev + 0.4;
                if (prev < 80) return prev + 0.2;
                if (prev < 90) return prev + 0.05;
                return prev + 0.02;
            });
        }, 20);

        return () => clearInterval(interval);
    }, [action.status]); // Restart behavior if status resets, though usually it flows linear

    return (
        <View style={styles.container}>
            {/* Thumbnail Area with Loader */}
            <View style={styles.thumbnailContainer}>
                {action.imageUri ? (
                    <Image
                        source={{ uri: action.imageUri }}
                        style={styles.thumbnailImage}
                    />
                ) : (
                    <View style={styles.placeholderThumbnail}>
                        <Text style={{ fontSize: 24 }}>
                            {action.type === 'text' ? '📝' : '✨'}
                        </Text>
                    </View>
                )}

                {/* Overlay with Circular Progress */}
                <View style={styles.loaderOverlay}>
                    {/* Darken background slightly to make loader pop */}
                    <View style={styles.dimmer} />
                    <CircularProgress
                        size={48}
                        strokeWidth={4}
                        progress={localProgress}
                        color={COLORS.brand.accent}
                        showPercentage={true} // Percentage inside
                    />
                </View>
            </View>

            <View style={styles.infoContainer}>
                <View style={styles.headerRow}>
                    <Text style={[styles.title, { color: COLORS.brand.accent }]}>
                        {action.label}
                    </Text>
                </View>

                {/* Status Text */}
                <Text style={styles.statusText}>
                    {action.status === 'analyzing' ? 'Identifying ingredients...' :
                        action.status === 'separating' ? 'Separating components...' :
                            action.status === 'calculating' ? 'Calculating Sugar Score...' :
                                action.status === 'finalizing' ? 'Almost done...' :
                                    action.status === 'failed' ? 'Analysis Failed' : 'Processing...'}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center', // Center vertically for better look with round loader
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: SIZES.borderRadius.m,
        ...SHADOWS.light,
        borderWidth: 1,
        borderColor: COLORS.brand.accent,
        opacity: 0.95
    },
    thumbnailContainer: {
        width: 60, // Slightly larger to fit loader
        height: 60,
        borderRadius: 30, // Make it circular to match loader? Or keep sqaure? User asked for "loader surrounding it".
        // If I make the container square but loader circular, it looks fine. 
        // Let's try circular thumbnail for the pending state, it looks cleaner with circular progress.
        overflow: 'hidden',
        marginRight: SPACING.m,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        position: 'relative'
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
        opacity: 0.6 // Dim it to show loader better
    },
    placeholderThumbnail: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.surface
    },
    loaderOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center'
    },
    dimmer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.2)'
    },
    infoContainer: {
        flex: 1,
        gap: 4
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between'
    },
    title: {
        fontFamily: FONTS.bodyBold,
        fontSize: 16,
    },
    statusText: {
        fontFamily: FONTS.medium,
        fontSize: 13,
        color: COLORS.textSecondary
    }
});
