import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { COLORS, FONTS, SPACING, SIZES } from '../../styles/theme';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { NavigationProps } from '../../navigation/types';
import { Zap, Activity } from 'lucide-react-native';

export default function TwoSignalsScreen() {
    const navigation = useNavigation<NavigationProps>();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.title}>
                        Two signals matter.
                    </Text>
                    <Text style={styles.subtitle}>
                        Some foods hit fast. Some hit slow. Some hit hard and fast.
                    </Text>
                </View>

                <View style={styles.cardsContainer}>
                    <Card style={styles.card}>
                        <View style={styles.iconContainer}>
                            <Activity size={32} color={COLORS.secondary} />
                        </View>
                        <Text style={styles.cardTitle}>Glucose Load</Text>
                        <Text style={styles.cardDescription}>
                            How much sugar is in your food.
                        </Text>
                    </Card>

                    <Card style={styles.card}>
                        <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 0, 122, 0.1)' }]}>
                            <Zap size={32} color={COLORS.accent} />
                        </View>
                        <Text style={styles.cardTitle}>Spike Speed</Text>
                        <Text style={styles.cardDescription}>
                            How fast does the sugar enter your cells.
                        </Text>
                    </Card>
                </View>

                <View style={styles.footer}>
                    <Button
                        title="Next"
                        onPress={() => navigation.navigate('ProteinMyth')}
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
        fontSize: 18,
        color: COLORS.textSecondary,
        lineHeight: 26,
    },
    cardsContainer: {
        gap: SPACING.m,
    },
    card: {
        padding: SPACING.l,
    },
    iconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: 'rgba(0, 212, 255, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.m,
    },
    cardTitle: {
        fontFamily: FONTS.subheading,
        fontSize: 20,
        color: COLORS.text,
        marginBottom: SPACING.xs,
    },
    cardDescription: {
        fontFamily: FONTS.body,
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    footer: {
        marginTop: SPACING.xl,
    },
    button: {
        width: '100%',
    },
});
