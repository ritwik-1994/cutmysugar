import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Rect, Text as SvgText, Line, Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS } from '../../styles/theme';
import { Meal } from '../../context/MealContext';
import { Card } from '../ui/Card';

interface WeeklyProgressChartProps {
    meals: Meal[];
    dailyBudget: number;
}

export const WeeklyProgressChart = ({ meals, dailyBudget }: WeeklyProgressChartProps) => {
    const chartHeight = 180;
    const [chartWidth, setChartWidth] = useState(0);
    const barWidth = 12;
    const spacing = chartWidth > 0 ? (chartWidth - (barWidth * 7)) / 6 : 0;

    const weeklyData = useMemo(() => {
        const days = [];
        const today = new Date();

        // Generate last 7 days
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            days.push(d);
        }

        return days.map(day => {
            const dayMeals = meals.filter(m => {
                const mDate = new Date(m.timestamp);
                return mDate.getDate() === day.getDate() &&
                    mDate.getMonth() === day.getMonth() &&
                    mDate.getFullYear() === day.getFullYear();
            });

            const totalGL = dayMeals.reduce((sum, m) => sum + m.gl, 0);

            return {
                day: day.toLocaleDateString('en-US', { weekday: 'short' }), // Mon, Tue
                fullDate: day,
                value: totalGL,
                isToday: day.getDate() === today.getDate()
            };
        });
    }, [meals]);

    // Calculate max value for scaling (at least 1.2x budget for headroom)
    const maxDataValue = Math.max(...weeklyData.map(d => d.value));
    const maxValue = Math.max(dailyBudget * 1.5, maxDataValue * 1.1);

    const getY = (value: number) => {
        return chartHeight - (value / maxValue) * chartHeight;
    };

    const getBarColor = (value: number) => {
        if (value > dailyBudget) return '#BE123C'; // Red
        if (value > dailyBudget * 0.75) return '#F97316'; // Orange
        if (value > dailyBudget * 0.5) return '#FACC15'; // Yellow
        return '#10B981'; // Green
    };

    const budgetY = getY(dailyBudget);

    // Generate path for the line
    const linePath = useMemo(() => {
        if (weeklyData.length === 0 || chartWidth === 0) return '';

        const points = weeklyData.map((item, index) => {
            const x = index * (barWidth + spacing) + barWidth / 2;
            const y = getY(item.value);
            return `${x},${y}`;
        });

        return `M ${points.join(' L ')}`;
    }, [weeklyData, maxValue, chartWidth, spacing]);

    return (
        <Card style={styles.container} variant="solid">
            <View style={styles.header}>
                <Text style={styles.title}>Daily Sugar Intake</Text>
                <Text style={styles.subtitle}>Last 7 Days (Sugar Score)</Text>
            </View>

            <View
                style={{ height: chartHeight + 30, marginTop: SPACING.m }}
                onLayout={(event) => {
                    const { width } = event.nativeEvent.layout;
                    setChartWidth(width);
                }}
            >
                {chartWidth > 0 && (
                    <Svg width={chartWidth} height={chartHeight + 30}>
                        {/* Gradient Definitions */}
                        <Defs>
                            <SvgLinearGradient id="weeklyChartGradient" x1="0" y1="1" x2="0" y2="0">
                                <Stop offset="0" stopColor="#10B981" />
                                <Stop offset={`${(dailyBudget * 0.5) / maxValue}`} stopColor="#10B981" />

                                <Stop offset={`${(dailyBudget * 0.5) / maxValue}`} stopColor="#FACC15" />
                                <Stop offset={`${(dailyBudget * 0.75) / maxValue}`} stopColor="#FACC15" />

                                <Stop offset={`${(dailyBudget * 0.75) / maxValue}`} stopColor="#F97316" />
                                <Stop offset={`${dailyBudget / maxValue}`} stopColor="#F97316" />

                                <Stop offset={`${dailyBudget / maxValue}`} stopColor="#BE123C" />
                                <Stop offset="1" stopColor="#BE123C" />
                            </SvgLinearGradient>
                        </Defs>

                        {/* Budget Line */}
                        <Line
                            x1="0"
                            y1={budgetY}
                            x2={chartWidth}
                            y2={budgetY}
                            stroke={COLORS.textTertiary}
                            strokeWidth="1"
                            strokeDasharray="4 4"
                            opacity={0.5}
                        />

                        {/* Budget Label */}
                        <SvgText
                            x={chartWidth}
                            y={budgetY - 6}
                            fill={COLORS.textTertiary}
                            fontSize="10"
                            fontFamily={FONTS.medium}
                            textAnchor="end"
                        >
                            Daily Limit: {dailyBudget}
                        </SvgText>

                        {/* Metallic Gradient Line Path */}
                        <Path
                            d={linePath}
                            stroke="url(#weeklyChartGradient)"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            fill="none"
                        />

                        {/* Data Points */}
                        {weeklyData.map((item, index) => {
                            const x = index * (barWidth + spacing) + barWidth / 2;
                            const y = getY(item.value);

                            return (
                                <React.Fragment key={index}>
                                    {/* Dot */}
                                    <Circle
                                        cx={x}
                                        cy={y}
                                        r="6"
                                        fill={getBarColor(item.value)}
                                        stroke={COLORS.surface}
                                        strokeWidth="3"
                                    />

                                    {/* Value Label (if non-zero) */}
                                    {item.value > 0 && (
                                        <SvgText
                                            x={x}
                                            y={y - 10}
                                            fill={COLORS.textSecondary}
                                            fontSize="10"
                                            fontFamily={FONTS.body}
                                            textAnchor="middle"
                                        >
                                            {Math.round(item.value)}
                                        </SvgText>
                                    )}

                                    {/* Day Label */}
                                    <SvgText
                                        x={x}
                                        y={chartHeight + 20}
                                        fill={item.isToday ? COLORS.text : COLORS.textTertiary}
                                        fontSize="12"
                                        fontFamily={item.isToday ? FONTS.bodyBold : FONTS.body}
                                        textAnchor="middle"
                                    >
                                        {item.day.charAt(0)}
                                    </SvgText>
                                </React.Fragment>
                            );
                        })}
                    </Svg>
                )}
            </View>
        </Card>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: SPACING.l,
        padding: SPACING.m,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    title: {
        fontFamily: FONTS.subheading,
        fontSize: 16,
        color: COLORS.text,
    },
    subtitle: {
        fontFamily: FONTS.body,
        fontSize: 12,
        color: COLORS.textTertiary,
    },
});
