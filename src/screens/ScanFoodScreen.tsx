import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Zap, Circle } from 'lucide-react-native';
import { COLORS, FONTS, SPACING, SIZES } from '../styles/theme';
import { Button } from '../components/ui/Button';
import { NavigationProps } from '../navigation/types';

export default function ScanFoodScreen() {
    const navigation = useNavigation<NavigationProps>();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const cameraRef = useRef<CameraView>(null);

    const takePicture = async () => {
        if (cameraRef.current) {
            try {
                const photo = await cameraRef.current.takePictureAsync({
                    base64: true,
                    quality: 0.3, // Aggressive compression to prevent timeouts
                });
                if (photo && photo.base64) {
                    navigation.navigate('FoodAnalysis', {
                        imageUri: photo.uri,
                        base64: photo.base64
                    });
                }
            } catch (error) {
                console.error('Failed to take picture:', error);
                Alert.alert('Error', 'Failed to capture photo');
            }
        }
    };

    if (!permission) {
        // Camera permissions are still loading.
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        // Camera permissions are not granted yet.
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

    return (
        <View style={styles.container}>
            <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing="back"
            >
                <SafeAreaView style={styles.overlay}>
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => navigation.goBack()}
                        >
                            <X color="#FFF" size={24} />
                        </TouchableOpacity>
                        <View style={styles.badge}>
                            <Zap size={14} color="#FFF" fill="#FFF" />
                            <Text style={styles.badgeText}>AI Scanner</Text>
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
                        <Text style={styles.hintText}>Position food within the frame</Text>
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
            </CameraView>
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
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.2)',
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
    },
    closeButton: {
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
    hintText: {
        color: '#FFF',
        fontFamily: FONTS.medium,
        fontSize: 16,
        marginTop: SPACING.xl,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
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
    webPlaceholder: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: COLORS.background,
        padding: SPACING.l,
    },
    webText: {
        fontFamily: FONTS.body,
        fontSize: 16,
        color: COLORS.text,
        marginBottom: SPACING.l,
        textAlign: 'center',
    }
});
