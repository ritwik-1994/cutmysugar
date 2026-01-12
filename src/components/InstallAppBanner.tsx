import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Platform } from 'react-native';
import { Share, X } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, FONTS, SHADOWS } from '../styles/theme';

export const InstallAppBanner = ({ triggerShow }: { triggerShow: boolean }) => {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [showIOSInstructions, setShowIOSInstructions] = useState(false);

    useEffect(() => {
        if (Platform.OS !== 'web') return;

        // Check availability
        const isStandaloneMode = (window.navigator as any).standalone || window.matchMedia('(display-mode: standalone)').matches;
        setIsStandalone(isStandaloneMode);
        if (isStandaloneMode) return;

        // 1. Android/Chrome Event
        const handleBeforeInstallPrompt = (e: any) => {
            e.preventDefault();
            setDeferredPrompt(e);
            // Ready to show, but waiting for trigger
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // 2. iOS Check
        const userAgent = window.navigator.userAgent.toLowerCase();
        const isMac = /macintosh|mac os x/i.test(userAgent);
        const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !isMac;
        if (isIosDevice) {
            setIsIOS(true);
        }

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    // Effect: Show when Trigger is True
    useEffect(() => {
        if (triggerShow && !isStandalone) {
            // Show banner regardless of event (fallback to manual instructions)
            setIsVisible(true);
        }
    }, [triggerShow, isStandalone]);

    const handleInstallClick = async () => {
        if (isIOS) {
            setShowIOSInstructions(true);
        } else if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response: ${outcome}`);
            setDeferredPrompt(null);
            setIsVisible(false);
        } else {
            // Desktop/Android Fallback (if event didn't fire, e.g. Dev Mode or Brave Shield)
            // We reuse the iOS instructions logic but with different text, or just alert?
            // Let's reuse the modal state but show Desktop text.
            setShowIOSInstructions(true); // Reusing the modal visibility state for simplicity
        }
    };

    if (!isVisible) return null;

    // Helper for modal content
    const isDesktop = !isIOS && Platform.OS === 'web';

    return (
        <>
            <View style={styles.banner}>
                <View style={styles.content}>
                    <Text style={styles.emoji}>📲</Text>
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>Install App</Text>
                        <Text style={styles.subtitle}>Save your progress! Add to Home Screen.</Text>
                    </View>
                </View>
                <View style={styles.actions}>
                    <TouchableOpacity onPress={() => setIsVisible(false)} style={styles.closeBtn}>
                        <X size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleInstallClick} style={styles.installBtn}>
                        <Text style={styles.installText}>Install</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Instructions Modal (Shared for iOS & Desktop Fallback) */}
            <Modal
                visible={showIOSInstructions}
                transparent
                animationType="fade"
                onRequestClose={() => setShowIOSInstructions(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowIOSInstructions(false)}
                >
                    <View style={styles.iosModal}>
                        <View style={styles.iosHeader}>
                            <Text style={styles.iosTitle}>
                                {isIOS ? "Install on iOS" : "Install on Browser"}
                            </Text>
                            <TouchableOpacity onPress={() => setShowIOSInstructions(false)}>
                                <X size={24} color={COLORS.text} />
                            </TouchableOpacity>
                        </View>

                        {isIOS ? (
                            <>
                                <View style={styles.step}>
                                    <Text style={styles.stepNum}>1</Text>
                                    <Text style={styles.stepText}>Tap the <Share size={18} color={COLORS.brand.primary} /> <Text style={{ fontWeight: 'bold' }}>Share</Text> button in your browser.</Text>
                                </View>
                                <View style={styles.step}>
                                    <Text style={styles.stepNum}>2</Text>
                                    <Text style={styles.stepText}>Scroll down and select <Text style={{ fontWeight: 'bold' }}>Add to Home Screen</Text>.</Text>
                                </View>
                                <View style={styles.step}>
                                    <Text style={styles.stepNum}>3</Text>
                                    <Text style={styles.stepText}>Tap <Text style={{ fontWeight: 'bold' }}>Add</Text> top right.</Text>
                                </View>
                            </>
                        ) : (
                            <>
                                <View style={styles.step}>
                                    <Text style={styles.stepNum}>1</Text>
                                    <Text style={styles.stepText}>Look for the <Text style={{ fontWeight: 'bold' }}>Install Icon</Text> (Computer/Plus) in your address bar URL field.</Text>
                                </View>
                                <View style={styles.step}>
                                    <Text style={styles.stepNum}>2</Text>
                                    <Text style={styles.stepText}>Click it and select <Text style={{ fontWeight: 'bold' }}>Install</Text>.</Text>
                                </View>
                                <View style={styles.step}>
                                    <Text style={styles.stepNum}>💡</Text>
                                    <Text style={styles.stepText}>If missing, tap the browser Menu (⋮) and look for "Install App" or "More Tools -> Create Shortcut".</Text>
                                </View>
                            </>
                        )}
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
};

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        bottom: 105, // Above FAB (FAB is ~96px from bottom)
        left: 20,
        right: 20,
        backgroundColor: COLORS.surface,
        borderRadius: SIZES.borderRadius.l,
        padding: SPACING.m,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        ...SHADOWS.medium,
        zIndex: 1000, // On top of everything
        maxWidth: 500, // Limit width on desktop
        alignSelf: 'center',
        borderWidth: 1,
        borderColor: COLORS.divider
    },
    content: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
        flex: 1,
    },
    emoji: {
        fontSize: 24,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontFamily: FONTS.heading,
        fontSize: 16,
        color: COLORS.text,
    },
    subtitle: {
        fontFamily: FONTS.body,
        fontSize: 12,
        color: COLORS.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.m,
    },
    closeBtn: {
        padding: 4,
    },
    installBtn: {
        backgroundColor: COLORS.brand.primary,
        paddingHorizontal: SPACING.m,
        paddingVertical: 8,
        borderRadius: SIZES.borderRadius.m,
    },
    installText: {
        fontFamily: FONTS.medium,
        color: '#FFF',
        fontSize: 14,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end', // Bottom sheet style for iOS
    },
    iosModal: {
        backgroundColor: COLORS.surface,
        borderTopLeftRadius: SIZES.borderRadius.l,
        borderTopRightRadius: SIZES.borderRadius.l,
        padding: SPACING.xl,
        paddingBottom: SPACING.xxl, // Safe area
    },
    iosHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.l,
    },
    iosTitle: {
        fontFamily: FONTS.heading,
        fontSize: 20,
        color: COLORS.text,
    },
    step: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.m,
        gap: SPACING.m,
    },
    stepNum: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: COLORS.sugarScore.safe,
        color: COLORS.brand.primary,
        textAlign: 'center',
        lineHeight: 24,
        fontFamily: FONTS.heading,
        fontSize: 14,
    },
    stepText: {
        fontFamily: FONTS.body,
        fontSize: 16,
        color: COLORS.text,
        flex: 1,
    }
});
