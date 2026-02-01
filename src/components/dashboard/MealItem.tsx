import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, LayoutAnimation, Platform, UIManager } from 'react-native';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS } from '../../styles/theme';
import { useLanguage } from '../../context/LanguageContext';
import { Meal } from '../../context/MealContext';
import { ChevronDown, ChevronUp, Lightbulb, Trash2 } from 'lucide-react-native';
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
    onDelete: () => void;
}

export const MealItem: React.FC<MealItemProps> = ({ meal, dailyBudget, onPressFix, onDelete }) => {
    const { strings } = useLanguage();
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
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <View style={{ flex: 1, marginRight: 8 }}>
                            <Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text>
                            <Text style={styles.mealTime}>
                                {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </Text>
                        </View>
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
                                {`+${calculateGLRange(meal.gl)} ${strings.METRICS.SUGAR_SCORE} (${glPercentage}%)`}
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
                                {meal.sugarSpeed === 'Fast' ? strings.METRICS.SUGAR_RUSH.FAST :
                                    meal.sugarSpeed === 'Moderate' ? strings.METRICS.SUGAR_RUSH.MODERATE :
                                        strings.METRICS.SUGAR_RUSH.SLOW}
                            </Text>
                        </View>
                    </View>

                    {/* Actions Row (Fix + Tip Preview + Delete) */}
                    <View style={styles.actionsRow}>
                        {/* Fix Button */}
                        {meal.analysisResult && (
                            <View style={styles.fixButton}>
                                <Text style={styles.fixButtonText}>{strings.HOME.ACTIONS.FIX_RESULT}</Text>
                            </View>
                        )}

                        {/* Smart Tip Preview Button */}
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
                                    {expanded ? "Hide Tips" : "Smart Tips"}
                                </Text>
                                {expanded ?
                                    <ChevronUp size={12} color={COLORS.sugarScore.safeText} /> :
                                    <ChevronDown size={12} color={COLORS.sugarScore.safeText} />
                                }
                            </TouchableOpacity>
                        )}

                        {/* Delete Button */}
                        <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={(e) => {
                                e?.stopPropagation();
                                console.log("🗑️ Trash Icon Pressed for meal:", meal.id);
                                onDelete();
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                            <Trash2 size={16} color={COLORS.textTertiary} />
                        </TouchableOpacity>
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
        borderRadius: 20,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.surfaceLight, // Subtle border
        ...SHADOWS.light,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        padding: 16,
        alignItems: 'center',
    },
    thumbnailContainer: {
        width: 64, // Larger thumbnail
        height: 64,
        borderRadius: 16,
        marginRight: 16,
        backgroundColor: '#F8FAFC',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: COLORS.divider,
    },
    thumbnail: {
        width: '100%',
        height: '100%',
    },
    mealName: {
        fontFamily: FONTS.heading,
        fontSize: 18, // Larger
        color: COLORS.text,
        marginBottom: 4,
    },
    mealTime: {
        fontFamily: FONTS.medium,
        fontSize: 13,
        color: COLORS.textTertiary,
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 8,
        marginTop: 4,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 100, // Pill shape
    },
    badgeText: {
        fontFamily: FONTS.bodyBold,
        fontSize: 10,
        textTransform: 'uppercase', // Premium feel
        letterSpacing: 0.5,
    },
    actionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: 6,
    },
    fixButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: COLORS.surfaceLight,
        borderWidth: 1,
        borderColor: COLORS.brand.accent,
    },
    fixButtonText: {
        fontFamily: FONTS.bodyBold,
        fontSize: 11,
        color: COLORS.brand.accent,
    },
    tipPreviewButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#F0FDF4', // Green tint
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#BBF7D0',
    },
    tipPreviewButtonActive: {
        backgroundColor: '#DCFCE7',
    },
    tipPreviewText: {
        flex: 1,
        fontFamily: FONTS.medium,
        fontSize: 12,
        color: '#15803D', // Green 700
    },
    deleteButton: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12,
        backgroundColor: COLORS.surfaceLight,
    },
    recommendationContainer: {
        backgroundColor: '#F0FDF4', // Match safe zone
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: '#BBF7D0',
    },
    recommendationContent: {
        gap: 4,
    },
    recommendationTitle: {
        fontFamily: FONTS.bodyBold,
        fontSize: 12,
        color: '#15803D',
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    recommendationText: {
        fontFamily: FONTS.body,
        fontSize: 14,
        color: '#166534', // Green 800
        lineHeight: 20,
    }
});
