import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS } from '../../styles/theme';
import { STRINGS } from '../../constants/strings';
import { Meal } from '../../context/MealContext';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react-native';
import { calculateGLRange } from '../../utils/glUtils';

if (Platform.OS === 'android') {
    if (UIManager.setLayoutAnimationEnabledExperimental) {
        UIManager.setLayoutAnimationEnabledExperimental(true);
    }
}

interface MealItemProps {
    meal: Meal;
    dailyBudget: number;
    onPressFix: () => void;
}

export const MealItem: React.FC<MealItemProps> = ({ meal, dailyBudget, onPressFix }) => {
    const [expanded, setExpanded] = useState(false);

    const glPercentage = Math.round((meal.gl / dailyBudget) * 100);
    const recommendations = meal.analysisResult?.recommendations || [];
    const hasRecommendations = recommendations.length > 0;
    const firstTip = hasRecommendations ? recommendations[0] : null;

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <TouchableOpacity
            style={styles.container}
            onPress={onPressFix}
            activeOpacity={0.9}
        >
            <View style={styles.header}>
                {/* Thumbnail */}
                <View style={styles.thumbnailContainer}>
                    {meal.imageUri ? (
                        <Image
                            source={{ uri: meal.imageUri }}
                            style={styles.thumbnail}
                            onError={(e) => console.log('❌ Image Load Error:', meal.imageUri, e.nativeEvent.error)}
                        />
                    ) : (
                        <View style={[styles.thumbnail, { backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' }]}>
                            <Text>🍽️</Text>
                        </View>
                    )}
                </View>

                {/* Main Info */}
                <View style={{ flex: 1 }}>
                    <View style={{ marginBottom: 6 }}>
                        <Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text>
                        <Text style={styles.mealTime}>
                            {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                    </View>

                    {/* Badges Row */}
                    <View style={styles.badgesRow}>
                        {/* GL Badge */}
                        <View style={[
                            styles.badge,
                            {
                                backgroundColor: Math.round(meal.gl) > 20 ? COLORS.sugarScore.danger :
                                    Math.round(meal.gl) > 10 ? COLORS.sugarScore.warning :
                                        COLORS.sugarScore.safe
                            }
                        ]}>
                            <Text style={[
                                styles.badgeText,
                                {
                                    color: Math.round(meal.gl) > 20 ? COLORS.sugarScore.criticalText :
                                        Math.round(meal.gl) > 10 ? COLORS.sugarScore.warningText :
                                            COLORS.sugarScore.safeText
                                }
                            ]}>
                                {`+${calculateGLRange(meal.gl)} ${STRINGS.METRICS.SUGAR_SCORE} (${glPercentage}%)`}
                            </Text>
                        </View>

                        {/* Sugar Speed Badge */}
                        <View style={[
                            styles.badge,
                            {
                                backgroundColor: meal.sugarSpeed === 'Fast' ? COLORS.sugarScore.danger :
                                    meal.sugarSpeed === 'Moderate' ? COLORS.sugarScore.warning :
                                        COLORS.sugarScore.safe
                            }
                        ]}>
                            <Text style={[
                                styles.badgeText,
                                {
                                    color: meal.sugarSpeed === 'Fast' ? COLORS.sugarScore.criticalText :
                                        meal.sugarSpeed === 'Moderate' ? COLORS.sugarScore.warningText :
                                            COLORS.sugarScore.safeText
                                }
                            ]}>
                                {meal.sugarSpeed === 'Fast' ? STRINGS.METRICS.SUGAR_RUSH.FAST :
                                    meal.sugarSpeed === 'Moderate' ? STRINGS.METRICS.SUGAR_RUSH.MODERATE :
                                        STRINGS.METRICS.SUGAR_RUSH.SLOW}
                            </Text>
                        </View>
                    </View>

                    {/* Actions Row (Fix + Tip Preview) */}
                    <View style={styles.actionsRow}>
                        {/* Fix Button: Removed redundant touchable, but kept visual if needed? 
                            User said "clickable... details". 
                            If I keep it, it's double. 
                            I'll render it as a VIEW (badge) or just remove the touchable wrapper but keep appearance?
                            Actually, simpler to remove it if the whole row is clickable. 
                            BUT, "Fix Result" is a strong CTA. 
                            I will change it to a View (non-interactive) since the parent handles the click.
                        */}
                        {meal.analysisResult && (
                            <View style={styles.fixButton}>
                                <Text style={styles.fixButtonText}>{STRINGS.HOME.ACTIONS.FIX_RESULT}</Text>
                            </View>
                        )}

                        {/* Smart Tip Preview Button - STOPS PROPAGATION */}
                        {hasRecommendations && firstTip && (
                            <TouchableOpacity
                                style={[styles.tipPreviewButton, expanded && styles.tipPreviewButtonActive]}
                                onPress={(e) => {
                                    // e.stopPropagation() is not needed in RN if child handles press
                                    toggleExpand();
                                }}
                                activeOpacity={0.7}
                            >
                                <Lightbulb size={12} color={COLORS.sugarScore.safeText} fill={expanded ? COLORS.sugarScore.safeText : 'rgba(6, 95, 70, 0.2)'} />
                                <Text style={styles.tipPreviewText} numberOfLines={1}>
                                    {expanded ? "Hide Tips" : firstTip}
                                </Text>
                                {expanded ?
                                    <ChevronUp size={12} color={COLORS.sugarScore.safeText} /> :
                                    <ChevronDown size={12} color={COLORS.sugarScore.safeText} />
                                }
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            {/* EXPANDABLE CONTENT: Full Smart Tips */}
            {hasRecommendations && expanded && (
                <View style={styles.recommendationContainer}>
                    <View style={styles.recommendationContent}>
                        <Text style={styles.recommendationTitle}>💡 Smart Swaps / Tips</Text>
                        {recommendations.map((rec, index) => (
                            <Text key={index} style={styles.recommendationText}>• {rec}</Text>
                        ))}
                    </View>
                </View>
            )}
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: 24, // Matches Speedometer
        borderWidth: 1,
        borderColor: COLORS.divider, // Rose 700
        ...SHADOWS.light,
        overflow: 'hidden',
        marginBottom: 8 // Increased spacing
    },
    header: {
        flexDirection: 'row',
        padding: SPACING.m,
        alignItems: 'center', // Center vertically
    },
    thumbnailContainer: {
        width: 56, // Slightly larger
        height: 56,
        borderRadius: 16, // Softer corners
        marginRight: SPACING.m,
        overflow: 'hidden',
        backgroundColor: COLORS.surfaceLight,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    mealName: {
        fontFamily: FONTS.heading, // Using heading font
        fontSize: 17,
        color: COLORS.text,
        marginBottom: 2,
    },
    mealTime: {
        fontFamily: FONTS.body,
        fontSize: 12,
        color: COLORS.textTertiary,
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 8,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeText: {
        fontFamily: FONTS.medium,
        fontSize: 10,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    fixButton: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.divider,
    },
    fixButtonText: {
        fontFamily: FONTS.medium,
        fontSize: 11,
        color: COLORS.textSecondary,
    },
    tipPreviewButton: {
        flex: 1, // Allow it to perform layout responsibly
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: COLORS.surfaceLight, // Rose 50
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.divider, // Rose 200
    },
    tipPreviewButtonActive: {
        backgroundColor: COLORS.surfaceLight,
        borderColor: COLORS.brand.primary,
    },
    tipPreviewText: {
        flex: 1, // Take available space for truncation
        fontFamily: FONTS.medium,
        fontSize: 11,
        color: COLORS.brand.secondary,
    },
    recommendationContainer: {
        backgroundColor: COLORS.surfaceLight, // Rose 50
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.m,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
    },
    recommendationContent: {
        paddingTop: SPACING.s,
    },
    recommendationTitle: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: COLORS.brand.secondary,
        marginBottom: 4,
    },
    recommendationText: {
        fontFamily: FONTS.body,
        fontSize: 13,
        color: COLORS.text,
        lineHeight: 18,
        marginBottom: 2,
    }
});
