import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useStore } from '../../constants/Store';

export default function CustomerHome() {
    const router = useRouter();
    const { workers } = useStore();
    const [search, setSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');

    const filteredWorkers = workers.filter(w => {
        const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase()) || w.category.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === 'All' || w.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.headerRow}>
                    <TouchableOpacity onPress={() => router.dismissAll()} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color={Colors.primary} />
                    </TouchableOpacity>
                    <Text style={styles.heading}>Find Services</Text>
                </View>

                {/* Search */}
                <View style={styles.searchBox}>
                    <Ionicons name="search" size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for plumbers, electricians..."
                        placeholderTextColor={Colors.textSecondary}
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>

                {/* Categories */}
                <Text style={styles.sectionTitle}>Categories</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
                    {['All', 'Plumber', 'Electrician', 'Cleaner', 'Carpenter'].map((cat) => (
                        <TouchableOpacity
                            key={cat}
                            style={[styles.categoryCard, activeCategory === cat && styles.activeCategory]}
                            onPress={() => setActiveCategory(cat)}
                        >
                            <Text style={[styles.categoryText, activeCategory === cat && styles.activeCategoryText]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Workers List */}
                <Text style={styles.sectionTitle}>Top Professionals</Text>
                <View style={styles.workerList}>
                    {filteredWorkers.map((worker) => (
                        <TouchableOpacity
                            key={worker.id}
                            style={styles.workerCard}
                            onPress={() => router.push({ pathname: '/(customer)/worker-detail/[id]', params: { id: worker.id } })}
                        >
                            <Image source={{ uri: worker.image }} style={styles.workerImage} />
                            <View style={styles.workerInfo}>
                                <Text style={styles.workerName}>{worker.name}</Text>
                                <Text style={styles.workerCategory}>{worker.category}</Text>
                                <View style={styles.ratingRow}>
                                    <Ionicons name="star" size={16} color={Colors.accent} />
                                    <Text style={styles.ratingText}>{worker.rating}</Text>
                                    <Text style={styles.rateText}>• {worker.hourlyRate} LKR/hr</Text>
                                </View>
                            </View>
                            <Ionicons name="chevron-forward" size={24} color={Colors.border} />
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    content: { padding: 24, paddingBottom: 100 },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    backButton: { marginRight: 16 },
    heading: { fontSize: 24, fontFamily: 'Inter_700Bold', color: Colors.primary },
    searchBox: {
        flexDirection: 'row', alignItems: 'center',
        padding: 12, backgroundColor: Colors.white, borderRadius: 12, marginBottom: 24,
        borderWidth: 1, borderColor: Colors.border
    },
    searchInput: { flex: 1, fontSize: 16, fontFamily: 'Inter_400Regular' },
    sectionTitle: { fontSize: 18, fontFamily: 'Inter_600SemiBold', marginBottom: 12, color: Colors.text },
    categoriesScroll: { marginBottom: 24, flexDirection: 'row' },
    categoryCard: {
        paddingVertical: 8, paddingHorizontal: 16, backgroundColor: Colors.white, borderRadius: 20,
        borderWidth: 1, borderColor: Colors.border, marginRight: 8,
    },
    activeCategory: { backgroundColor: Colors.primary, borderColor: Colors.primary },
    categoryText: { fontFamily: 'Inter_600SemiBold', color: Colors.textSecondary },
    activeCategoryText: { color: Colors.white },
    workerList: { gap: 16 },
    workerCard: {
        flexDirection: 'row', alignItems: 'center',
        padding: 16, backgroundColor: Colors.white, borderRadius: 16,
        shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 10, elevation: 2,
        borderWidth: 1, borderColor: Colors.background
    },
    workerImage: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
    workerInfo: { flex: 1 },
    workerName: { fontSize: 16, fontFamily: 'Inter_600SemiBold', color: Colors.text },
    workerCategory: { fontSize: 14, color: Colors.textSecondary, marginBottom: 4 },
    ratingRow: { flexDirection: 'row', alignItems: 'center' },
    ratingText: { marginLeft: 4, fontFamily: 'Inter_700Bold', color: Colors.text, fontSize: 14 },
    rateText: { marginLeft: 8, color: Colors.textSecondary, fontSize: 14 }
});
