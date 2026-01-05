import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, Platform } from 'react-native';
import { Camera, Search, Barcode, Edit3, X } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS } from '../../styles/theme';
import { BlurView } from 'expo-blur';

interface AddMealModalProps {
    visible: boolean;
    onClose: () => void;
    onOptionSelect: (option: 'scan' | 'search' | 'barcode' | 'manual') => void;
}

const { width } = Dimensions.get('window');

export const AddMealModal = ({ visible, onClose, onOptionSelect }: AddMealModalProps) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                {/* Blur Effect for modern feel */}
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
                ) : (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.5)' }]} />
                )}

                <TouchableOpacity
                    activeOpacity={1}
                    style={styles.content}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={styles.header}>
                        <Text style={styles.title}>Add Meal</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <X size={24} color={COLORS.textSecondary} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.grid}>
                        {/* Prominent Scan Option */}
                        <TouchableOpacity
                            style={[styles.optionCard, styles.prominentCard]}
                            onPress={() => onOptionSelect('scan')}
                        >
                            <View style={[styles.iconContainer, styles.prominentIcon, { backgroundColor: '#E8F0FE' }]}>
                                <Camera size={48} color={COLORS.brand.primary} />
                            </View>
                            <View>
                                <Text style={styles.prominentLabel}>Scan Photo</Text>
                                <Text style={styles.prominentSublabel}>Instant AI Analysis</Text>
                            </View>
                        </TouchableOpacity>

                        {/* Secondary Options Row */}
                        <View style={styles.secondaryRow}>
                            <TouchableOpacity
                                style={styles.optionCard}
                                onPress={() => onOptionSelect('search')}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: '#FEF3C7' }]}>
                                    <Search size={24} color="#D97706" />
                                </View>
                                <Text style={styles.optionLabel}>Search DB</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.optionCard}
                                onPress={() => onOptionSelect('manual')}
                            >
                                <View style={[styles.iconContainer, { backgroundColor: '#FEE2E2' }]}>
                                    <Edit3 size={24} color="#DC2626" />
                                </View>
                                <Text style={styles.optionLabel}>Manual</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'flex-end',
    },
    content: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: SIZES.borderRadius.xl,
        borderTopRightRadius: SIZES.borderRadius.xl,
        padding: SPACING.l,
        paddingBottom: SPACING.xxl, // Extra padding for bottom safe area
        ...SHADOWS.medium,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    title: {
        fontFamily: FONTS.heading,
        fontSize: 20,
        color: COLORS.text,
    },
    closeButton: {
        padding: 4,
    },
    grid: {
        gap: SPACING.m,
    },
    prominentCard: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.l,
        gap: SPACING.m,
        backgroundColor: COLORS.background,
        borderWidth: 1,
        borderColor: COLORS.brand.primary, // Highlight border
    },
    prominentIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 0, // Reset
    },
    prominentLabel: {
        fontFamily: FONTS.heading,
        fontSize: 20,
        color: COLORS.text,
        marginBottom: 4,
    },
    prominentSublabel: {
        fontFamily: FONTS.body,
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    secondaryRow: {
        flexDirection: 'row',
        gap: SPACING.m,
    },
    optionCard: {
        flex: 1,
        backgroundColor: COLORS.background,
        borderRadius: SIZES.borderRadius.l,
        padding: SPACING.m,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.divider,
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.s,
    },
    optionLabel: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.text,
    },
});
