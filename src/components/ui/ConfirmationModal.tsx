import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Platform } from 'react-native';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS } from '../../styles/theme';
import { Button } from './Button';
import { AlertTriangle } from 'lucide-react-native';

interface ConfirmationModalProps {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    visible,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    variant = 'danger'
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <TouchableOpacity
                style={styles.overlay}
                activeOpacity={1}
                onPress={onClose}
            >
                <View style={styles.container}>
                    {/* Icon */}
                    <View style={[styles.iconContainer, { backgroundColor: variant === 'danger' ? '#FEE2E2' : '#FEF3C7' }]}>
                        <AlertTriangle
                            size={32}
                            color={variant === 'danger' ? COLORS.sugarScore.danger : '#D97706'}
                        />
                    </View>

                    {/* Text */}
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.message}>{message}</Text>

                    {/* Buttons */}
                    <View style={styles.buttonRow}>
                        <Button
                            title={cancelText}
                            variant="secondary"
                            onPress={onClose}
                            style={{ flex: 1 }}
                        />
                        <Button
                            title={confirmText}
                            // @ts-ignore: Custom button might not strictly key off this exact string if not updated, but we'll use primary for now and style it
                            variant="primary"
                            onPress={onConfirm}
                            style={{
                                flex: 1,
                                backgroundColor: variant === 'danger' ? COLORS.sugarScore.danger : COLORS.brand.primary
                            }}
                        />
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: SPACING.l,
    },
    container: {
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.borderRadius.l,
        padding: SPACING.xl,
        alignItems: 'center',
        ...SHADOWS.medium,
    },
    iconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.m,
    },
    title: {
        fontFamily: FONTS.heading,
        fontSize: 20,
        color: COLORS.text,
        marginBottom: SPACING.s,
        textAlign: 'center',
    },
    message: {
        fontFamily: FONTS.body,
        fontSize: 15,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.xl,
        lineHeight: 22,
    },
    buttonRow: {
        flexDirection: 'row',
        gap: SPACING.m,
        width: '100%',
    }
});
