import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { COLORS, FONTS, SPACING, SIZES, SHADOWS } from '../../styles/theme';
import { Button } from '../ui/Button';
import { X, Check } from 'lucide-react-native';
import { useAuth, User } from '../../context/AuthContext';
import { GOALS, DIETS } from '../../constants/options';

interface EditProfileModalProps {
    visible: boolean;
    onClose: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({ visible, onClose }) => {
    const { user, updateProfile } = useAuth();
    const [loading, setLoading] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [selectedGoal, setSelectedGoal] = useState<string | null>(null);
    const [selectedDiet, setSelectedDiet] = useState<string | null>(null);

    // Initialize form with user data
    useEffect(() => {
        if (visible && user) {
            setName(user.name || '');
            setHeight(user.height ? user.height.toString() : '');
            setWeight(user.weight ? user.weight.toString() : '');
            setSelectedGoal(user.primary_goal || null);
            setSelectedDiet(user.dietary_preference || null);
        }
    }, [visible, user]);

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Name is required");
            return;
        }

        setLoading(true);
        try {
            const updates: Partial<User> = {
                name: name.trim(),
                height: height ? parseFloat(height) : undefined,
                weight: weight ? parseFloat(weight) : undefined,
                primary_goal: selectedGoal || undefined,
                dietary_preference: selectedDiet || undefined,
            };

            const { error } = await updateProfile(updates);

            if (error) {
                Alert.alert("Error", "Failed to update profile. Please try again.");
            } else {
                // Success feedback
                if (Platform.OS === 'web') {
                    window.alert("Profile Updated Successfully!");
                } else {
                    Alert.alert("Success", "Profile Updated Successfully!");
                }
                onClose();
            }
        } catch (e) {
            console.error(e);
            Alert.alert("Error", "An unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.container}
            >
                <View style={styles.header}>
                    <Text style={styles.title}>Edit Profile</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                        <X size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

                    {/* Basic Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Basic Info</Text>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Name</Text>
                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your name"
                                placeholderTextColor={COLORS.textDisabled}
                            />
                        </View>

                        <View style={styles.row}>
                            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={styles.label}>Height (cm)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={height}
                                    onChangeText={setHeight}
                                    placeholder="e.g. 175"
                                    keyboardType="numeric"
                                    placeholderTextColor={COLORS.textDisabled}
                                />
                            </View>
                            <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={styles.label}>Weight (kg)</Text>
                                <TextInput
                                    style={styles.input}
                                    value={weight}
                                    onChangeText={setWeight}
                                    placeholder="e.g. 70"
                                    keyboardType="numeric"
                                    placeholderTextColor={COLORS.textDisabled}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Goals Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Primary Goal</Text>
                        <View style={styles.optionsGrid}>
                            {GOALS.map((goal) => (
                                <TouchableOpacity
                                    key={goal.id}
                                    style={[
                                        styles.goalCard,
                                        selectedGoal === goal.id && styles.selectedGoal
                                    ]}
                                    onPress={() => setSelectedGoal(goal.id)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.goalIcon}>{goal.icon}</Text>
                                    <Text style={[
                                        styles.goalLabel,
                                        selectedGoal === goal.id && styles.selectedOptionText
                                    ]}>
                                        {goal.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Diet Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Dietary Preference</Text>
                        <View style={styles.pillsContainer}>
                            {DIETS.map((diet) => (
                                <TouchableOpacity
                                    key={diet.id}
                                    style={[
                                        styles.dietPill,
                                        selectedDiet === diet.id && styles.selectedDietPill
                                    ]}
                                    onPress={() => setSelectedDiet(diet.id)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={styles.dietIcon}>{diet.icon}</Text>
                                    <Text style={[
                                        styles.dietLabel,
                                        selectedDiet === diet.id && styles.selectedOptionText
                                    ]}>
                                        {diet.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                </ScrollView>

                <View style={styles.footer}>
                    <Button
                        title="Save Changes"
                        onPress={handleSave}
                        loading={loading}
                        icon={<Check size={20} color="#FFF" style={{ marginRight: 8 }} />}
                    />
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: SPACING.l,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
        backgroundColor: COLORS.surface,
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
        paddingBottom: 100,
    },
    section: {
        marginBottom: SPACING.xl,
    },
    sectionTitle: {
        fontFamily: FONTS.subheading,
        fontSize: 16,
        color: COLORS.text,
        marginBottom: SPACING.m,
    },
    inputGroup: {
        marginBottom: SPACING.m,
    },
    label: {
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 6,
    },
    input: {
        backgroundColor: COLORS.surface,
        borderWidth: 1,
        borderColor: COLORS.divider,
        borderRadius: SIZES.borderRadius.s,
        padding: 12, // Increased padding
        fontFamily: FONTS.body, // Ensure a default font is set
        fontSize: 16,
        color: COLORS.text,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    // Goals Grid
    optionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.s,
    },
    goalCard: {
        width: '48%',
        backgroundColor: COLORS.surface,
        padding: SPACING.m,
        borderRadius: SIZES.borderRadius.m,
        borderWidth: 1,
        borderColor: COLORS.divider,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: SPACING.s,
    },
    selectedGoal: {
        borderColor: COLORS.brand.primary,
        backgroundColor: 'rgba(190, 18, 60, 0.05)',
    },
    goalIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    goalLabel: { // Renamed from optionLabel to avoid conflict if I used shared styles, but here local is fine
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.textSecondary,
        textAlign: 'center',
    },
    selectedOptionText: {
        color: COLORS.brand.primary,
        fontFamily: FONTS.bodyBold,
    },
    // Diet Pills
    pillsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPACING.s,
    },
    dietPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        borderWidth: 1,
        borderColor: COLORS.divider,
    },
    selectedDietPill: {
        borderColor: COLORS.brand.primary,
        backgroundColor: 'rgba(190, 18, 60, 0.05)',
    },
    dietIcon: { // Renamed
        fontSize: 16,
        marginRight: 6,
    },
    dietLabel: { // Renamed
        fontFamily: FONTS.medium,
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    footer: {
        padding: SPACING.l,
        borderTopWidth: 1,
        borderTopColor: COLORS.divider,
        backgroundColor: COLORS.surface,
    }
});
