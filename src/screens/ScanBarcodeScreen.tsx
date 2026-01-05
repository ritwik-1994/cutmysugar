import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, X } from 'lucide-react-native';
import { COLORS, SPACING, SIZES } from '../styles/theme';
import { barcodeService } from '../services/BarcodeService';
import { NavigationProps, RootStackParamList } from '../navigation/types';

type ScanBarcodeRouteProp = RouteProp<RootStackParamList, 'ScanBarcode'>;

export default function ScanBarcodeScreen() {
    const navigation = useNavigation<NavigationProps>();
    const route = useRoute<ScanBarcodeRouteProp>();
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission]);

    const handleBarCodeScanned = async ({ data }: { data: string }) => {
        if (scanned || isLoading) return;

        setScanned(true);
        setIsLoading(true);
        console.log(`[ScanBarcode] Scanned: ${data}`);

        try {
            const product = await barcodeService.getProduct(data);

            if (product) {
                // Navigate to Analysis Screen with product data
                navigation.navigate('FoodAnalysis', {
                    productData: product,
                    date: route.params?.date
                });
            } else {
                Alert.alert(
                    "Product Not Found",
                    "We couldn't find this product in the database. You can try scanning again or take a photo instead.",
                    [{ text: "OK", onPress: () => setScanned(false) }]
                );
            }
        } catch (error) {
            Alert.alert("Error", "Something went wrong. Please try again.");
            setScanned(false);
        } finally {
            setIsLoading(false);
        }
    };

    if (!permission) {
        return <View style={styles.container} />;
    }

    if (!permission.granted) {
        return (
            <View style={styles.container}>
                <Text style={{ color: 'white', textAlign: 'center', marginTop: 100 }}>
                    We need your permission to show the camera
                </Text>
                <TouchableOpacity onPress={requestPermission} style={styles.permButton}>
                    <Text style={styles.permButtonText}>Grant Permission</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["ean13", "ean8", "upc_a", "upc_e"],
                }}
            />

            <SafeAreaView style={styles.overlay}>
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
                        <X color="white" size={28} />
                    </TouchableOpacity>
                    <Text style={styles.title}>Scan Barcode</Text>
                    <View style={{ width: 28 }} />
                </View>

                <View style={styles.scannerFrameContainer}>
                    <View style={styles.scannerFrame}>
                        <View style={[styles.corner, styles.topLeft]} />
                        <View style={[styles.corner, styles.topRight]} />
                        <View style={[styles.corner, styles.bottomLeft]} />
                        <View style={[styles.corner, styles.bottomRight]} />
                    </View>
                    {isLoading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={COLORS.brand.primary} />
                            <Text style={styles.loadingText}>Fetching Product...</Text>
                        </View>
                    )}
                </View>

                <View style={styles.footer}>
                    <Text style={styles.instructionText}>
                        Align the barcode within the frame
                    </Text>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'black',
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: SPACING.m,
    },
    closeButton: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.4)',
        borderRadius: 20,
    },
    title: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    scannerFrameContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerFrame: {
        width: 280,
        height: 280,
        position: 'relative',
    },
    corner: {
        position: 'absolute',
        width: 40,
        height: 40,
        borderColor: 'white',
        borderWidth: 4,
    },
    topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
    topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
    bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
    bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },

    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 20,
    },
    loadingText: {
        color: 'white',
        marginTop: SPACING.m,
        fontSize: 16,
        fontWeight: '600',
    },
    footer: {
        padding: SPACING.xl,
        alignItems: 'center',
    },
    instructionText: {
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        opacity: 0.8,
    },
    permButton: {
        marginTop: 20,
        backgroundColor: COLORS.brand.primary,
        padding: 12,
        borderRadius: 8,
        alignSelf: 'center',
    },
    permButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
});
