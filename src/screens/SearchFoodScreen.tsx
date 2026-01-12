import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TextInput,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/types';
import { ArrowLeft, Search, X } from 'lucide-react-native';
import { COLORS, SPACING, SIZES, SHADOWS } from '../styles/theme';
import { foodDatabaseService, FoodItem } from '../services/FoodDatabaseService';
import PortionModal from '../components/search/PortionModal';
import { calculateGLRange } from '../utils/glUtils';

type SearchFoodRouteProp = RouteProp<RootStackParamList, 'SearchFood'>;

export default function SearchFoodScreen() {
    const navigation = useNavigation();
    const route = useRoute<SearchFoodRouteProp>();
    const { date } = route.params || {};
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<FoodItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);

    useEffect(() => {
        // Load database on mount
        const loadDb = async () => {
            setIsLoading(true);
            try {
                await foodDatabaseService.loadDatabase();
            } catch (error) {
                console.error('Failed to load food database', error);
            } finally {
                setIsLoading(false);
            }
        };
        loadDb();
    }, []);

    const handleSearch = useCallback((text: string) => {
        setQuery(text);
        if (text.length >= 2) {
            const searchResults = foodDatabaseService.search(text);
            setResults(searchResults);
        } else {
            setResults([]);
        }
    }, []);

    const clearSearch = () => {
        setQuery('');
        setResults([]);
    };

    const getGLColor = (category: string) => {
        switch (category?.toLowerCase()) {
            case 'low': return COLORS.gl.safeText; // Use text color for better visibility
            case 'medium': return COLORS.gl.warningText;
            case 'high': return COLORS.gl.criticalText;
            default: return COLORS.textSecondary;
        }
    };

    const getGLBgColor = (category: string) => {
        switch (category?.toLowerCase()) {
            case 'low': return COLORS.gl.safe;
            case 'medium': return COLORS.gl.warning;
            case 'high': return COLORS.gl.critical;
            default: return COLORS.surface;
        }
    };

    const renderItem = ({ item }: { item: FoodItem }) => (
        <TouchableOpacity
            style={styles.resultItem}
            onPress={() => setSelectedFood(item)}
        >
            <View style={styles.itemContent}>
                <Text style={styles.itemName}>{item.canonical_name}</Text>
                <Text style={styles.itemCategory}>{item.primary_category}</Text>
            </View>
            <View style={[styles.glBadge, { backgroundColor: getGLBgColor(item.gl_category) }]}>
                <Text style={[styles.glText, { color: getGLColor(item.gl_category) }]}>
                    GL {calculateGLRange(item.gl_median)}
                </Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <ArrowLeft color={COLORS.text} size={24} />
                </TouchableOpacity>
                <Text style={styles.title}>Search Food</Text>
            </View>

            <View style={styles.searchContainer}>
                <Search color={COLORS.textSecondary} size={20} style={styles.searchIcon} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search for Indian or Global foods..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={query}
                    onChangeText={handleSearch}
                    autoFocus
                />
                {query.length > 0 && (
                    <TouchableOpacity onPress={clearSearch}>
                        <X color={COLORS.textSecondary} size={20} />
                    </TouchableOpacity>
                )}
            </View>

            {isLoading ? (
                <View style={styles.centerContent}>
                    <ActivityIndicator size="large" color={COLORS.brand.primary} />
                    <Text style={styles.loadingText}>Loading database...</Text>
                </View>
            ) : (
                <FlatList
                    data={results}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.food_id}
                    contentContainerStyle={styles.listContent}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={
                        query.length >= 2 ? (
                            <View style={styles.centerContent}>
                                <Text style={styles.emptyText}>No foods found.</Text>
                            </View>
                        ) : (
                            <View style={styles.centerContent}>
                                <Text style={styles.emptyText}>Type to search...</Text>
                            </View>
                        )
                    }
                />
            )}

            {selectedFood && (
                <PortionModal
                    visible={!!selectedFood}
                    food={selectedFood}
                    onClose={() => setSelectedFood(null)}
                    onAdd={() => {
                        setSelectedFood(null);
                        navigation.goBack();
                    }}
                    date={date}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    backButton: {
        padding: SPACING.xs,
        marginRight: SPACING.s,
    },
    title: {
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.surface,
        margin: SPACING.m,
        paddingHorizontal: SPACING.m,
        borderRadius: SIZES.borderRadius.l,
        borderWidth: 1,
        borderColor: COLORS.divider,
        height: 50,
    },
    searchIcon: {
        marginRight: SPACING.s,
    },
    searchInput: {
        flex: 1,
        color: COLORS.text,
        fontSize: 16,
        height: '100%',
    },
    listContent: {
        padding: SPACING.m,
    },
    resultItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: SPACING.m,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.divider,
    },
    itemContent: {
        flex: 1,
        marginRight: SPACING.m,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.text,
        marginBottom: 4,
    },
    itemCategory: {
        fontSize: 14,
        color: COLORS.textSecondary,
    },
    glBadge: {
        paddingHorizontal: SPACING.s,
        paddingVertical: 4,
        borderRadius: SIZES.borderRadius.s,
    },
    glText: {
        fontSize: 12,
        fontWeight: '600',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 40,
    },
    loadingText: {
        marginTop: SPACING.m,
        color: COLORS.textSecondary,
    },
    emptyText: {
        color: COLORS.textSecondary,
        fontSize: 16,
    },
});
