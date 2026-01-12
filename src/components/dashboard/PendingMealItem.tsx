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

                <View style={styles.loaderOverlay}>
                    {/* Add a subtle pulse or badge if needed, but keeping it clean */}
                </View>
            </View>

            <View style={styles.infoContainer}>
                <View style={styles.headerRow}>
                    <Text style={[styles.title, { color: COLORS.brand.accent }]}>
                        {action.label}
                    </Text>
                    <Text style={styles.percentageText}>{Math.round(localProgress)}%</Text>
                </View>

                {/* Status Text */}
                <Text style={styles.statusText}>
                    {action.status === 'analyzing' ? 'Identifying ingredients...' :
                        action.status === 'separating' ? 'Separating components...' :
                            action.status === 'calculating' ? 'Calculating Sugar Score...' :
                                action.status === 'finalizing' ? 'Almost done...' :
                                    action.status === 'failed' ? 'Analysis Failed' : 'Processing...'}
                </Text>

                {/* Linear Progress Bar */}
                <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${localProgress}%` }]} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: SIZES.borderRadius.m,
        ...SHADOWS.light,
        borderWidth: 1,
        borderColor: COLORS.brand.accent, // Keeping accent border for "Active" feel
    },
    thumbnailContainer: {
        width: 50,
        height: 50,
        borderRadius: 8,
        overflow: 'hidden',
        marginRight: SPACING.m,
        backgroundColor: COLORS.background,
        position: 'relative'
    },
    thumbnailImage: {
        width: '100%',
        height: '100%',
        opacity: 0.8
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
    infoContainer: {
        flex: 1,
        gap: 6
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    title: {
        fontFamily: FONTS.bodyBold,
        fontSize: 15,
    },
    percentageText: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: COLORS.brand.primary
    },
    statusText: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: COLORS.textSecondary
    },
    progressBarTrack: {
        height: 4,
        backgroundColor: COLORS.background,
        borderRadius: 2,
        overflow: 'hidden',
        marginTop: 2
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: COLORS.brand.accent,
        borderRadius: 2
    }
});
