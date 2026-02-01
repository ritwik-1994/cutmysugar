import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { COLORS } from '../../styles/theme';

export interface WebCameraRef {
    takePictureAsync: (options?: { base64?: boolean; quality?: number }) => Promise<{
        uri: string;
        base64?: string;
        width: number;
        height: number;
    }>;
}

interface WebCameraProps {
    style?: any;
}

export const WebCamera = forwardRef<WebCameraRef, WebCameraProps>((props, ref) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [streamInfo, setStreamInfo] = useState<string>('');

    useImperativeHandle(ref, () => ({
        takePictureAsync: async (options) => {
            if (!videoRef.current) throw new Error("Camera not ready");

            const video = videoRef.current;
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            const ctx = canvas.getContext('2d');
            if (!ctx) throw new Error("Could not create canvas context");

            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

            const quality = options?.quality ?? 1.0;
            const dataUrl = canvas.toDataURL('image/jpeg', quality);

            return {
                uri: dataUrl,
                base64: options?.base64 ? dataUrl.split(',')[1] : undefined,
                width: canvas.width,
                height: canvas.height
            };
        }
    }));

    useEffect(() => {
        let activeStream: MediaStream | null = null;

        const startCamera = async () => {
            console.log("📷 WebCamera: Starting stream request...");
            try {
                // Constraints Priority: Resolution > Focus > FrameRate
                // Note: On mobile devices, width/height usually refer to Landscape orientation values.
                // Requesting strict "min" can sometimes cause failure if device only supports lower in Portrait.
                // We start with "Ideal 4K" which browsers interpret as "Best Available".

                const constraints: MediaStreamConstraints = {
                    audio: false,
                    video: {
                        facingMode: { ideal: 'environment' }, // Prefer rear camera
                        width: { ideal: 3840, min: 1280 },    // Aim for 4K, accept at least 720p
                        height: { ideal: 2160, min: 720 }
                    }
                };

                const stream = await navigator.mediaDevices.getUserMedia(constraints);
                console.log("✅ WebCamera: Stream acquired", stream.id);
                activeStream = stream;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.onloadedmetadata = () => {
                        console.log("▶️ WebCamera: Metadata loaded, playing...");
                        videoRef.current?.play().catch(e => console.error("Play error:", e));

                        // Debug Info
                        const track = stream.getVideoTracks()[0];
                        const settings = track.getSettings();
                        setStreamInfo(`${settings.width}x${settings.height}`);

                        // APPLY ADVANCED CAPABILITIES (Focus, Exposure)
                        // This is crucial for "crispness" on mobile web
                        const capabilities = track.getCapabilities ? track.getCapabilities() : {};

                        const advancedConstraints: any = {};
                        if ((capabilities as any).focusMode?.includes('continuous')) {
                            advancedConstraints.focusMode = 'continuous';
                        }
                        if ((capabilities as any).exposureMode?.includes('continuous')) {
                            advancedConstraints.exposureMode = 'continuous';
                        }
                        if ((capabilities as any).whiteBalanceMode?.includes('continuous')) {
                            advancedConstraints.whiteBalanceMode = 'continuous';
                        }

                        if (Object.keys(advancedConstraints).length > 0) {
                            track.applyConstraints({ advanced: [advancedConstraints] }).catch(err => {
                                console.log("Advanced constraints failed:", err);
                            });
                        }
                    };
                }
            } catch (err: any) {
                console.error("WebCamera Error:", err);
                const msg = "Camera access denied or device incompatible.";
                setError(msg);
                if (Platform.OS === 'web') alert(`Camera Error: ${err.message || msg}`);
            }
        };

        startCamera();

        return () => {
            console.log("🛑 WebCamera: Cleanup triggered. Stopping details...");
            if (activeStream) {
                activeStream.getTracks().forEach(t => {
                    console.log(`Stopping track: ${t.kind} ${t.label}`);
                    t.stop();
                });
            }
        };
    }, []);

    return (
        <View style={[styles.container, props.style]}>
            {error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                </View>
            ) : (
                <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
                    <video
                        ref={videoRef}
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            transform: Platform.OS === 'web' && navigator.userAgent.includes('Mirror') ? 'scaleX(-1)' : 'none' // Just in case of mirroring, though rare for rear cam
                        }}
                        playsInline
                        muted
                        autoPlay
                    />
                    {/* Optional: Debug overlay to confirm resolution to user (Hidden for prod, nice for verify) */}
                    {/* <div style={{ position: 'absolute', top: 5, left: 5, background: 'rgba(0,0,0,0.5)', color: 'lime', padding: 2, fontSize: 10 }}>
                        {streamInfo}
                    </div> */}
                </div>
            )}
        </View>
    );
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#111',
    },
    errorText: {
        color: COLORS.text,
        textAlign: 'center',
    }
});
