import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS } from '../../styles/theme';
import { STRINGS } from '../../constants/strings';
import { Meal } from '../../context/MealContext';
import { ChevronDown, ChevronUp, Lightbulb } from 'lucide-react-native';

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
        <View style={styles.container}>
            <View style={styles.header}>
                {/* Thumbnail */}
                <View style={styles.thumbnailContainer}>
                    {meal.imageUri ? (
                        <Image source={{ uri: meal.imageUri }} style={styles.thumbnail} />
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
                                {`+${Math.round(meal.gl)} ${STRINGS.METRICS.SUGAR_SCORE} (${glPercentage}%)`}
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
                        {/* Fix Button - Always visible if analysis exists */}
                        {meal.analysisResult && (
                            <TouchableOpacity style={styles.fixButton} onPress={onPressFix}>
                                <Text style={styles.fixButtonText}>{STRINGS.HOME.ACTIONS.FIX_RESULT}</Text>
                            </TouchableOpacity>
                        )}

                        {/* Smart Tip Preview Button */}
                        {hasRecommendations && firstTip && (
                            <TouchableOpacity
                                style={[styles.tipPreviewButton, expanded && styles.tipPreviewButtonActive]}
                                onPress={toggleExpand}
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
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.borderRadius.m,
        ...SHADOWS.light,
        overflow: 'hidden', // Contain the expansion
        marginBottom: 2 // Tiny margin for shadow visibility if needed
    },
    header: {
        flexDirection: 'row',
        padding: SPACING.m,
        alignItems: 'flex-start',
    },
    thumbnailContainer: {
        width: 48,
        height: 48,
        borderRadius: 8,
        marginRight: SPACING.m,
        overflow: 'hidden',
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    mealName: {
        fontFamily: FONTS.bodyBold,
        fontSize: 16,
        color: COLORS.text,
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
        backgroundColor: '#ECFDF5', // Emerald 50 (Very light green)
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#D1FAE5', // Emerald 100
    },
    tipPreviewButtonActive: {
        backgroundColor: '#D1FAE5', // Emerald 100
        borderColor: '#6EE7B7', // Emerald 300
    },
    tipPreviewText: {
        flex: 1, // Take available space for truncation
        fontFamily: FONTS.medium,
        fontSize: 11,
        color: COLORS.sugarScore.safeText,
    },
    recommendationContainer: {
        backgroundColor: '#F0FDF4', // Emerald 50 (Green tint)
        paddingHorizontal: SPACING.m,
        paddingBottom: SPACING.m,
        paddingTop: 0,
        borderTopWidth: 1,
        borderTopColor: '#D1FAE5',
    },
    recommendationContent: {
        paddingTop: SPACING.s,
    },
    recommendationTitle: {
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: COLORS.sugarScore.safeText,
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
