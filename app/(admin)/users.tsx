import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../../constants/Store';

export default function AdminUsers() {
    const { workers } = useStore();
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'workers' | 'customers'>('all');

    const filteredWorkers = workers.filter(w =>
        w.name.toLowerCase().includes(search.toLowerCase()) ||
        w.category.toLowerCase().includes(search.toLowerCase())
    );

    const handleDeleteUser = (id: string, name: string) => {
        Alert.alert(
            'Delete User',
            `Are you sure you want to delete ${name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete', style: 'destructive', onPress: () => {
                    // Implement delete logic here
                    Alert.alert('Success', 'User deleted successfully');
                }},
            ]
        );
    };

    const handleToggleStatus = (id: string, name: string, currentStatus: boolean) => {
        Alert.alert(
            'Change Status',
            `${currentStatus ? 'Deactivate' : 'Activate'} ${name}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Confirm', onPress: () => {
                    // Implement status toggle logic here
                    Alert.alert('Success', 'Status updated successfully');
                }},
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.heading}>User Management</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Ionicons name="add" size={24} color={Colors.background} />
                </TouchableOpacity>
            </View>

            {/* Search */}
            <View style={styles.searchBox}>
                <Ionicons name="search" size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search users..."
                    placeholderTextColor={Colors.textSecondary}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                {[
                    { key: 'all', label: 'All Users' },
                    { key: 'workers', label: 'Workers' },
                    { key: 'customers', label: 'Customers' },
                ].map((filter) => (
                    <TouchableOpacity
                        key={filter.key}
                        style={[styles.filterTab, filterType === filter.key && styles.activeFilter]}
                        onPress={() => setFilterType(filter.key as any)}
                    >
                        <Text style={[styles.filterText, filterType === filter.key && styles.activeFilterText]}>
                            {filter.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Users List */}
            <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                {filteredWorkers.map((worker) => (
                    <View key={worker.id} style={styles.userCard}>
                        <View style={styles.userInfo}>
                            <View style={styles.avatarContainer}>
                                <Text style={styles.avatarText}>{worker.name.charAt(0)}</Text>
                            </View>
                            <View style={styles.userDetails}>
                                <Text style={styles.userName}>{worker.name}</Text>
                                <Text style={styles.userCategory}>{worker.category}</Text>
                                <View style={styles.userStats}>
                                    <Ionicons name="star" size={14} color="#FFD700" />
                                    <Text style={styles.userRating}>{worker.rating}</Text>
                                    <Text style={styles.userDivider}>•</Text>
                                    <Text style={styles.userJobs}>{worker.jobsCompleted} jobs</Text>
                                </View>
                            </View>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.statusButton]}
                                onPress={() => handleToggleStatus(worker.id, worker.name, true)}
                            >
                                <Ionicons name="checkmark-circle-outline" size={20} color="#4CAF50" />
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={() => handleDeleteUser(worker.id, worker.name)}
                            >
                                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                            </TouchableOpacity>
                        </View>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
        paddingHorizontal: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 10,
    },
    heading: {
        fontSize: 28,
        fontWeight: 'bold',
        color: Colors.text,
    },
    addButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: Colors.text,
    },
    filterContainer: {
        flexDirection: 'row',
        marginBottom: 20,
        gap: 8,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: Colors.card,
    },
    activeFilter: {
        backgroundColor: Colors.primary,
    },
    filterText: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    activeFilterText: {
        color: Colors.background,
    },
    listContainer: {
        flex: 1,
    },
    userCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.background,
    },
    userDetails: {
        flex: 1,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 4,
    },
    userCategory: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 4,
    },
    userStats: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userRating: {
        fontSize: 12,
        color: Colors.text,
        marginLeft: 4,
    },
    userDivider: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginHorizontal: 6,
    },
    userJobs: {
        fontSize: 12,
        color: Colors.textSecondary,
    },
    actions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    statusButton: {
        backgroundColor: '#4CAF50' + '20',
    },
    deleteButton: {
        backgroundColor: '#FF6B6B' + '20',
    },
});
