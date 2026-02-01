import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert, Image, TextInput, KeyboardAvoidingView, ScrollView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation, useRoute } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Zap, ArrowLeft, Send, Smartphone } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, SIZES } from '../styles/theme';
import { Button } from '../components/ui/Button';
import { NavigationProps } from '../navigation/types';
import { useMeal } from '../context/MealContext';

import { WebCamera } from '../components/camera/WebCamera';

export default function ScanFoodScreen() {
    const { startScan } = useMeal();
    const navigation = useNavigation<NavigationProps>();
    const route = useRoute();
    const { date, mealId } = route.params as { date?: string; mealId?: string } || {};
    const [permission, requestPermission] = useCameraPermissions();

    // Preview State
    const [capturedImage, setCapturedImage] = useState<{ uri: string; base64: string } | null>(null);
    const [contextText, setContextText] = useState('');

    // Use any to support both CameraView and WebCamera refs
    const cameraRef = useRef<any>(null);

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    base64: true,
                    quality: 0.8, // Slightly reduced quality for speed, we have logic for this
                });
                if (photo && photo.base64) {
                    // Switch to Preview Mode
                    setCapturedImage({ uri: photo.uri, base64: photo.base64 });
                }
            } catch (error) {
                console.error('Failed to take picture:', error);
                Alert.alert('Error', 'Failed to capture photo');
            }
        }
    };

    const handleRetake = () => {
        console.log("🔄 Retake requested - resetting state");
        setCapturedImage(null);
        setContextText('');
    };

    const handleConfirmAnalysis = () => {
        if (!capturedImage) return;

        console.log('[ScanFood] Starting background scan...');
        // Trigger background scan with date and optional context
        startScan(capturedImage.uri, capturedImage.base64, date, contextText.trim(), mealId);

        // Close the modal to reveal Home
        navigation.goBack();
    };

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={styles.permissionContainer}>
                <View style={styles.permissionContent}>
                    <Text style={styles.permissionTitle}>Camera Access Needed</Text>
                    <Text style={styles.permissionText}>
                        GlucoWise needs access to your camera to scan your food and analyze its glycemic impact.
                    </Text>
                    <Button title="Grant Permission" onPress={requestPermission} />
                    <Button
                        title="Cancel"
                        variant="ghost"
                        onPress={() => navigation.goBack()}
                        style={{ marginTop: SPACING.m }}
                    />
                </View>
            </SafeAreaView>
        );
    }

    // --- RENDER PREVIEW MODE ---
    if (capturedImage) {
        const Wrapper = Platform.OS === 'web' ? View : KeyboardAvoidingView;
        const wrapperProps = Platform.OS === 'web' ? { style: { flex: 1 } } : { behavior: 'padding' as const, style: { flex: 1 } };

        return (
            <SafeAreaView style={styles.container}>
                <Wrapper {...wrapperProps}>
                    <View style={styles.previewContainer}>
                        {/* Image Area (Flex 1 to take available space) */}
                        <View style={styles.previewImageContainer}>
                            <Image
                                source={{ uri: capturedImage.uri }}
                                style={styles.previewImage}
                                resizeMode="contain"
                            />

                            {/* Header Overlay (on top of black background/image) */}
                            <View style={styles.headerOverlay}>
                                <TouchableOpacity style={styles.iconButton} onPress={handleRetake}>
                                    <ArrowLeft color="#FFF" size={24} />
                                </TouchableOpacity>
                                <Text style={styles.headerTitle}>Review Photo</Text>
                                <View style={{ width: 40 }} />
                            </View>
                        </View>

                        {/* Context Input & Actions - Non-overlapping Footer */}
                        <View style={styles.contextCard}>
                            <Text style={styles.contextLabel}>Add Context (Optional)</Text>
                            <TextInput
                                style={styles.contextInput}
                                placeholder="e.g. 1 tsp sugar, 2 rotis..."
                                placeholderTextColor="#9ca3af"
                                value={contextText}
                                onChangeText={setContextText}
                                multiline
                                maxLength={150}
                            />

                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={[styles.retakeBtn, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}
                                    onPress={handleRetake}
                                >
                                    <Text style={styles.retakeText}>Retake</Text>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[styles.analyzeBtn, Platform.OS === 'web' && ({ cursor: 'pointer' } as any)]}
                                    onPress={handleConfirmAnalysis}
                                >
                                    <Text style={styles.analyzeText}>Analyze Food</Text>
                                    <Send size={18} color="#FFF" style={{ marginLeft: 8 }} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </Wrapper>
            </SafeAreaView>
        );
    }

    // --- RENDER CAMERA MODE ---
    // Use a key to force full re-mount of the camera component when returning from preview
    const cameraKey = `camera-${capturedImage ? 'hidden' : 'visible'}`;

    return (
        <View style={styles.container}>
            {Platform.OS === 'web' ? (
                <WebCamera key={cameraKey} ref={cameraRef} style={styles.camera} />
            ) : (
                <CameraView
                    key={cameraKey}
                    ref={cameraRef}
                    style={styles.camera}
                    facing="back"
                />
            )}

            <SafeAreaView style={styles.overlay} pointerEvents="box-none">
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={() => navigation.goBack()}
                    >
                        <X color="#FFF" size={24} />
                    </TouchableOpacity>
                    <View style={styles.badge}>
                        <Zap size={14} color="#FFF" fill="#FFF" />
                        <Text style={styles.badgeText}>AI Scanner ({Platform.OS === 'web' ? 'HQ' : 'Native'})</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.scanFrameContainer}>
                    <View style={styles.scanFrame}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                    </View>
                    <View style={styles.hintContainer}>
                        {/* Side View Diagram */}
                        <View style={styles.diagramContainer}>
                            {/* Dashed Vertical Reference */}
                            <View style={styles.dashedVertical} />

                            {/* Phone at 45deg */}
                            <View style={styles.phoneWrapper}>
                                <Smartphone size={32} color="rgba(255,255,255,1)" />
                            </View>

                            {/* Field of View Cone */}
                            <View style={styles.fovCone} />

                            {/* Food Plate */}
                            <View style={styles.plateWrapper}>
                                {/* Steam Effect */}
                                <View style={styles.steamGroup}>
                                    <View style={[styles.steamLine, { height: 8, transform: [{ rotate: '-15deg' }] }]} />
                                    <View style={[styles.steamLine, { height: 12, marginTop: -4 }]} />
                                    <View style={[styles.steamLine, { height: 8, transform: [{ rotate: '15deg' }] }]} />
                                </View>
                                <View style={styles.foodMound} />
                                <View style={styles.plateBase} />
                            </View>

                            {/* Angle Label */}
                            <View style={styles.angleLabel}>
                                <Text style={styles.angleText}>45°</Text>
                            </View>
                        </View>

                        <Text style={styles.hintText}>Position food within the frame</Text>
                        <Text style={styles.subHintText}>Angle camera 45° downward for best results</Text>
                    </View>
                </View>

                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.shutterButton}
                        onPress={takePicture}
                        activeOpacity={0.7}
                    >
                        <View style={styles.shutterInner} />
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    permissionContainer: {
        flex: 1,
        backgroundColor: COLORS.background,
        justifyContent: 'center',
        padding: SPACING.l,
    },
    permissionContent: {
        alignItems: 'center',
        gap: SPACING.m,
    },
    permissionTitle: {
        fontFamily: FONTS.heading,
        fontSize: 24,
        color: COLORS.text,
        textAlign: 'center',
    },
    permissionText: {
        fontFamily: FONTS.body,
        fontSize: 16,
        color: COLORS.textSecondary,
        textAlign: 'center',
        marginBottom: SPACING.l,
    },
    camera: {
        flex: 1,
    },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
    },
    headerTitle: {
        color: '#FFF',
        fontFamily: FONTS.heading,
        fontSize: 18,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(90, 107, 255, 0.8)', // Brand accent with opacity
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    badgeText: {
        color: '#FFF',
        fontFamily: FONTS.medium,
        fontSize: 14,
    },
    scanFrameContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    scanFrame: {
        width: 280,
        height: 280,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: '#FFF',
        borderWidth: 4,
    },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
    hintContainer: {
        marginTop: SPACING.xl,
        alignItems: 'center',
        gap: 8,
    },
    hintText: {
        color: '#FFF',
        fontFamily: FONTS.medium,
        fontSize: 18,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
        textAlign: 'center',
    },
    subHintText: {
        color: 'rgba(255,255,255,0.8)',
        fontFamily: FONTS.body,
        fontSize: 14,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
        textAlign: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    footer: {
        padding: SPACING.xl,
        alignItems: 'center',
        paddingBottom: SPACING.xxl,
    },
    shutterButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255,255,255,0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFF',
    },
    shutterInner: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#FFF',
    },
    // Preview Styles
    previewContainer: {
        flex: 1,
        backgroundColor: '#000',
        flexDirection: 'column',
    },
    previewImageContainer: {
        flex: 1,
        position: 'relative',
        backgroundColor: '#000',
    },
    previewImage: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
    },
    headerOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
        zIndex: 10,
        backgroundColor: 'rgba(0,0,0,0.3)', // Slight dim for text legibility
    },
    previewOverlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
    },
    contextCard: {
        backgroundColor: COLORS.surface, // Solid background now, not transparent overlay
        padding: SPACING.l,
        paddingBottom: Platform.OS === 'ios' ? 20 : SPACING.l, // Adjust for KeyboardAvoidingView/SafeArea
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
        zIndex: 50, // Ensure it sits above anything else
        elevation: 5,
    },
    contextLabel: {
        color: COLORS.text, // Dark text on light surface
        fontFamily: FONTS.medium,
        fontSize: 14,
        marginBottom: 8,
    },
    contextInput: {
        backgroundColor: COLORS.background,
        borderRadius: 12,
        padding: 12,
        color: COLORS.text,
        fontFamily: FONTS.body,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: SPACING.l,
        borderWidth: 1,
        borderColor: COLORS.divider,
    },
    actionRow: {
        flexDirection: 'row',
        gap: SPACING.m,
    },
    retakeBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: COLORS.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: COLORS.divider,
    },
    retakeText: {
        color: COLORS.textSecondary,
        fontFamily: FONTS.medium,
        fontSize: 16,
    },
    analyzeBtn: {
        flex: 2,
        flexDirection: 'row',
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: COLORS.brand.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    analyzeText: {
        color: '#FFF',
        fontFamily: FONTS.heading,
        fontSize: 16,
    },
    diagramContainer: {
        width: 160,
        height: 120,
        marginBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        backgroundColor: 'rgba(0,0,0,0.6)', // Dark background for contrast
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    dashedVertical: {
        position: 'absolute',
        left: 30,
        top: 15,
        bottom: 25,
        width: 1,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.5)', // Higher contrast
        borderStyle: 'dashed',
    },
    phoneWrapper: {
        position: 'absolute',
        top: 15,
        right: 40,
        transform: [{ rotate: '-45deg' }],
        zIndex: 10,
    },
    fovCone: {
        position: 'absolute',
        top: 40,
        right: 65,
        width: 0,
        height: 0,
        borderTopWidth: 40,
        borderTopColor: 'transparent',
        borderBottomWidth: 40,
        borderBottomColor: 'transparent',
        borderRightWidth: 60,
        borderRightColor: 'rgba(255,255,255,0.3)', // Higher visibility cone
        transform: [{ rotate: '135deg' }],
    },
    plateWrapper: {
        position: 'absolute',
        bottom: 20,
        left: 40,
        alignItems: 'center',
    },
    steamGroup: {
        flexDirection: 'row',
        gap: 3,
        marginBottom: 2,
        opacity: 0.8,
    },
    steamLine: {
        width: 2,
        backgroundColor: 'rgba(255,255,255,0.7)',
        borderRadius: 1,
    },
    foodMound: {
        width: 32, // Wider food
        height: 16,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        marginBottom: 1, // Slight gap for realism
    },
    plateBase: {
        width: 50, // Wider plate
        height: 6,
        backgroundColor: 'rgba(255,255,255,0.85)',
        borderRadius: 4,
        borderBottomLeftRadius: 8, // More bowl/plate like
        borderBottomRightRadius: 8,
    },
    angleLabel: {
        position: 'absolute',
        top: 25,
        right: 15,
        backgroundColor: COLORS.brand.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
    },
    angleText: {
        color: '#FFF',
        fontFamily: FONTS.heading,
        fontSize: 12,
    }
});
