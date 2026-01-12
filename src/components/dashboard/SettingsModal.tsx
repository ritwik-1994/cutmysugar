import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, Linking, Platform, Share } from 'react-native';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS } from '../../styles/theme';
import { Button } from '../ui/Button';
import { X, Mail, MessageCircle, LogOut, FileText, ChevronRight, Share2 } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

interface SettingsModalProps {
    visible: boolean;
    onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ visible, onClose }) => {
    const { logout, user } = useAuth();
    const [policyVisible, setPolicyVisible] = useState(false);

    const handleWhatsAppSupport = () => {
        // Replace with actual business number
        Linking.openURL('https://wa.me/917728086673?text=Hi, I need help with CutMySugar');
    };

    const handleShare = async () => {
        try {
            await Share.share({
                message: 'I\'m executing better energy and focus with CutMySugar! ⚡️ Track your sugar spikes here: https://cutmysugar.app',
            });
        } catch (error) {
            console.error(error);
        }
    };

    const PRIVACY_POLICY = `
**Privacy Policy for CutMySugar**

**1. Data Collection**
We collect data you provide, including food logs, photos, and health goals, to calculate your Sugar Score and provide insights.

**2. AI Analysis**
Your food photos and descriptions are processed by artificial intelligence (Gemini) to identify ingredients and estimate nutritional values. This data is processed securely and is not used to train public models without your consent.

**3. Health Disclaimer**
CutMySugar provides information for educational purposes only. It is not a medical device and does not provide medical advice. Consult a doctor before making significant dietary changes.

**4. Data Security**
Your data is stored securely using industry-standard encryption. We do not sell your personal data to third parties.

**5. Contact**
For privacy concerns, contact support@cutmysugar.com.
    `.trim();

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.container}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Settings</Text>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                            <X size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    {/* Content */}
                    <ScrollView contentContainerStyle={styles.content}>

                        {/* User Info */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Account</Text>
                            <View style={styles.row}>
                                <Text style={styles.label}>Phone</Text>
                                <Text style={styles.value}>{user?.phone || 'Unknown'}</Text>
                            </View>
                            {user?.name && (
                                <View style={styles.row}>
                                    <Text style={styles.label}>Name</Text>
                                    <Text style={styles.value}>{user.name}</Text>
                                </View>
                            )}
                        </View>

                        {/* Share */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Spread the Word</Text>
                            <TouchableOpacity style={styles.menuItem} onPress={handleShare}>
                                <View style={[styles.iconBox, { backgroundColor: '#F0F9FF' }]}>
                                    <Share2 size={20} color="#0284C7" />
                                </View>
                                <View style={styles.menuText}>
                                    <Text style={styles.menuTitle}>Invite Friends</Text>
                                    <Text style={styles.menuSub}>Help others cut sugar</Text>
                                </View>
                                <ChevronRight size={20} color={COLORS.textTertiary} />
                            </TouchableOpacity>
                        </View>

                        {/* Support */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Support</Text>
                            <Text style={styles.helperText}>
                                Having trouble? We are here to help during the beta!
                            </Text>

                            <TouchableOpacity style={styles.menuItem} onPress={handleWhatsAppSupport}>
                                <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                                    <MessageCircle size={20} color="#166534" />
                                </View>
                                <View style={styles.menuText}>
                                    <Text style={styles.menuTitle}>Chat on WhatsApp</Text>
                                    <Text style={styles.menuSub}>Fastest response</Text>
                                </View>
                                <ChevronRight size={20} color={COLORS.textTertiary} />
                            </TouchableOpacity>
                        </View>

                        {/* Legal */}
                        <View style={styles.section}>
                            <Text style={styles.sectionTitle}>Legal</Text>
                            <TouchableOpacity
                                style={styles.menuItem}
                                onPress={() => setPolicyVisible(true)}
                            >
                                <View style={[styles.iconBox, { backgroundColor: '#F3F4F6' }]}>
                                    <FileText size={20} color={COLORS.textSecondary} />
                                </View>
                                <View style={styles.menuText}>
                                    <Text style={styles.menuTitle}>Privacy Policy</Text>
                                </View>
                                <ChevronRight size={20} color={COLORS.textTertiary} />
                            </TouchableOpacity>
                        </View>

                        {/* Logout */}
                        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                            <LogOut size={20} color={COLORS.sugarScore.criticalText} />
                            <Text style={styles.logoutText}>Log Out</Text>
                        </TouchableOpacity>

                        <Text style={styles.version}>Version 1.0.0 (MVP)</Text>

                    </ScrollView>
                </View>
            </View>

            {/* Privacy Policy Modal */}
            <Modal
                visible={policyVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setPolicyVisible(false)}
            >
                <View style={styles.policyContainer}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Privacy Policy</Text>
                        <TouchableOpacity onPress={() => setPolicyVisible(false)} style={styles.closeBtn}>
                            <X size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>
                    <ScrollView contentContainerStyle={{ padding: SPACING.l }}>
                        <Text style={styles.policyText}>{PRIVACY_POLICY}</Text>
                    </ScrollView>
                </View>
            </Modal>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    container: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '85%',
        ...SHADOWS.medium,
    },
    policyContainer: {
        flex: 1,
        backgroundColor: COLORS.surface,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.l,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    title: {
        fontFamily: FONTS.heading,
        fontSize: 20,
        color: COLORS.text,
    },
    closeBtn: {
        padding: 4,
    },
    content: {
        padding: SPACING.l,
        paddingBottom: 40,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontFamily: FONTS.bodyBold,
        fontSize: 14,
        color: COLORS.textTertiary,
        marginBottom: SPACING.m,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    helperText: {
        fontFamily: FONTS.body,
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: SPACING.m,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.surfaceLight,
    },
    label: {
        fontFamily: FONTS.medium,
        fontSize: 16,
        color: COLORS.textSecondary,
    },
    value: {
        fontFamily: FONTS.heading,
        fontSize: 16,
        color: COLORS.text,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        marginBottom: 8,
    },
    iconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    menuText: {
        flex: 1,
    },
    menuTitle: {
        fontFamily: FONTS.medium,
        fontSize: 16,
        color: COLORS.text,
    },
    menuSub: {
        fontFamily: FONTS.body,
        fontSize: 12,
        color: COLORS.brand.primary,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: SPACING.m,
        backgroundColor: '#FEE2E2',
        borderRadius: SIZES.borderRadius.m,
        marginTop: SPACING.l,
        gap: 8,
    },
    logoutText: {
        fontFamily: FONTS.bodyBold,
        fontSize: 16,
        color: COLORS.sugarScore.criticalText,
    },
    version: {
        textAlign: 'center',
        marginTop: SPACING.l,
        color: COLORS.textTertiary,
        fontFamily: FONTS.body,
        fontSize: 12,
    },
    policyText: {
        fontFamily: FONTS.body,
        fontSize: 16,
        lineHeight: 24,
        color: COLORS.text,
    }
});
