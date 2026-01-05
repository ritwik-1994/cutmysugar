import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, SIZES } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { NavigationProps } from '../../navigation/types';

export default function ProteinMythScreen() {
    const navigation = useNavigation<NavigationProps>();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>
                        Protein slows spikes.
                    </Text>
                    <Text style={styles.subtitle}>
                        It does <Text style={styles.highlight}>NOT</Text> remove sugar.
                    </Text>
                </View>

                <View style={styles.visualContainer}>
                    <Card style={styles.card}>
                        <View style={styles.row}>
                            <View style={styles.foodInfo}>
                                <Text style={styles.foodEmoji}>🍞</Text>
                                <Text style={styles.foodName}>Bread alone</Text>
                            </View>
                            <View style={styles.arrowContainer}>
                                <Text style={styles.arrow}>→</Text>
                            </View>
                            <View style={styles.resultInfo}>
                                <Text style={styles.resultEmoji}>🚀</Text>
                                <Text style={styles.resultText}>Fast Spike</Text>
                            </View>
                        </View>
                    </Card>

                    <Card style={styles.card}>
                        <View style={styles.row}>
                            <View style={styles.foodInfo}>
                                <Text style={styles.foodEmoji}>🍞 + 🥚</Text>
                                <Text style={styles.foodName}>Bread + Eggs</Text>
                            </View>
                            <View style={styles.arrowContainer}>
                                <Text style={styles.arrow}>→</Text>
                            </View>
                            <View style={styles.resultInfo}>
                                <Text style={styles.resultEmoji}>⛰️</Text>
                                <Text style={styles.resultText}>Delayed</Text>
                            </View>
                        </View>
                    </Card>
                </View>

                <View style={styles.footer}>
                    <Text style={styles.footnote}>
                        To reduce glucose load, carbs must be reduced.
                    </Text>
                    <Button
                        title="Next"
                        onPress={() => navigation.navigate('Preferences')}
                        style={styles.button}
                    />
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    content: {
        flex: 1,
        padding: SPACING.l,
        justifyContent: 'space-between',
    },
    header: {
        marginBottom: SPACING.l,
    },
    title: {
        fontFamily: FONTS.heading,
        fontSize: 32,
        color: COLORS.text,
        marginBottom: SPACING.s,
    },
    subtitle: {
        fontFamily: FONTS.body,
        fontSize: 24,
        color: COLORS.textSecondary,
    },
    highlight: {
        color: COLORS.danger,
        fontFamily: FONTS.heading,
    },
    visualContainer: {
        gap: SPACING.m,
    },
    card: {
        padding: SPACING.m,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    foodInfo: {
        flex: 1,
        alignItems: 'center',
    },
    foodEmoji: {
        fontSize: 32,
        marginBottom: SPACING.xs,
    },
    foodName: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.text,
    },
    arrowContainer: {
        paddingHorizontal: SPACING.s,
    },
    arrow: {
        fontSize: 24,
        color: COLORS.textTertiary,
    },
    resultInfo: {
        flex: 1,
        alignItems: 'center',
    },
    resultEmoji: {
        fontSize: 32,
        marginBottom: SPACING.xs,
    },
    resultText: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    footer: {
        gap: SPACING.m,
    },
    footnote: {
        fontFamily: FONTS.body,
        fontSize: 14,
        color: COLORS.textTertiary,
        textAlign: 'center',
    },
    button: {
        width: '100%',
    },
});
