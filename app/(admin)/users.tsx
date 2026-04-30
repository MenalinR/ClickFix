import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { api, apiCall } from '../../constants/api';
import { useStore } from '../../constants/Store';

type UserRow = {
    id: string;
    name: string;
    role: 'worker' | 'customer';
    subtitle: string;
    rating?: number;
    jobsCompleted?: number;
    isActive: boolean;
    raw: any;
};

export default function AdminUsers() {
    const { workers, fetchWorkers, token } = useStore();
    const [customers, setCustomers] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'workers' | 'customers'>('all');
    const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);

    useEffect(() => {
        fetchWorkers();
    }, [fetchWorkers]);

    useEffect(() => {
        if (!token) return;
        (async () => {
            try {
                const res = await apiCall(api.customers.getAll, 'GET', undefined, token);
                setCustomers(res?.data || []);
            } catch {
                // silent
            }
        })();
    }, [token]);

    const rows = useMemo<UserRow[]>(() => {
        const workerRows: UserRow[] = workers.map((w: any) => ({
            id: w.id || w._id,
            name: w.name || '—',
            role: 'worker',
            subtitle: w.category || 'Worker',
            rating: w.rating || 0,
            jobsCompleted: w.jobsCompleted || 0,
            isActive: w.isActive !== false,
            raw: w,
        }));
        const customerRows: UserRow[] = customers.map((c: any) => ({
            id: c.id || c._id,
            name: c.name || '—',
            role: 'customer',
            subtitle: c.email || c.phone || 'Customer',
            isActive: c.isActive !== false,
            raw: c,
        }));
        if (filterType === 'workers') return workerRows;
        if (filterType === 'customers') return customerRows;
        return [...workerRows, ...customerRows];
    }, [workers, customers, filterType]);

    const filteredRows = rows.filter((u) => {
        const q = search.toLowerCase();
        return (
            u.name.toLowerCase().includes(q) ||
            u.subtitle.toLowerCase().includes(q)
        );
    });

    const reloadCustomers = async () => {
        if (!token) return;
        try {
            const res = await apiCall(api.customers.getAll, 'GET', undefined, token);
            setCustomers(res?.data || []);
        } catch {
            // silent
        }
    };

    const handleDeleteUser = (u: UserRow) => {
        Alert.alert(
            'Delete User',
            `Permanently delete ${u.name}? This cannot be undone.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const url =
                                u.role === 'worker'
                                    ? api.admin.deleteWorker(u.id)
                                    : api.admin.deleteCustomer(u.id);
                            await apiCall(url, 'DELETE', undefined, token);
                            if (u.role === 'worker') {
                                await fetchWorkers();
                            } else {
                                await reloadCustomers();
                            }
                            Alert.alert('Deleted', `${u.name} has been removed.`);
                        } catch (err: any) {
                            Alert.alert('Error', err?.message || 'Failed to delete user');
                        }
                    },
                },
            ]
        );
    };

    const handleToggleStatus = (u: UserRow) => {
        const next = !u.isActive;
        Alert.alert(
            next ? 'Activate User' : 'Deactivate User',
            next
                ? `Re-enable ${u.name}'s account?`
                : `Deactivate ${u.name}? They will not be able to log in or work.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    onPress: async () => {
                        try {
                            const url =
                                u.role === 'worker'
                                    ? api.admin.setWorkerActive(u.id)
                                    : api.admin.setCustomerActive(u.id);
                            await apiCall(url, 'PUT', { isActive: next }, token);
                            if (u.role === 'worker') {
                                await fetchWorkers();
                            } else {
                                await reloadCustomers();
                            }
                        } catch (err: any) {
                            Alert.alert('Error', err?.message || 'Failed to update status');
                        }
                    },
                },
            ]
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.heading}>User Management</Text>
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
                {filteredRows.map((u) => (
                    <TouchableOpacity
                        key={`${u.role}-${u.id}`}
                        style={[styles.userCard, !u.isActive && styles.userCardDisabled]}
                        activeOpacity={0.7}
                        onPress={() => setSelectedUser(u)}
                    >
                        <View style={styles.userInfo}>
                            <View
                                style={[
                                    styles.avatarContainer,
                                    !u.isActive && styles.avatarContainerDisabled,
                                ]}
                            >
                                <Text style={styles.avatarText}>{u.name.charAt(0)}</Text>
                            </View>
                            <View style={styles.userDetails}>
                                <View style={styles.userNameRow}>
                                    <Text style={styles.userName}>{u.name}</Text>
                                    {!u.isActive && (
                                        <Text style={styles.disabledBadge}>Deactivated</Text>
                                    )}
                                </View>
                                <Text style={styles.userCategory}>{u.subtitle}</Text>
                                {u.role === 'worker' ? (
                                    <View style={styles.userStats}>
                                        <Ionicons name="star" size={14} color="#FFD700" />
                                        <Text style={styles.userRating}>{u.rating ?? 0}</Text>
                                        <Text style={styles.userDivider}>•</Text>
                                        <Text style={styles.userJobs}>{u.jobsCompleted ?? 0} jobs</Text>
                                    </View>
                                ) : (
                                    <View style={styles.userStats}>
                                        <Ionicons name="person-outline" size={14} color={Colors.textSecondary} />
                                        <Text style={styles.userJobs}>Customer</Text>
                                    </View>
                                )}
                            </View>
                        </View>
                        <View style={styles.actions}>
                            <TouchableOpacity
                                style={[
                                    styles.actionButton,
                                    u.isActive ? styles.statusButton : styles.statusButtonInactive,
                                ]}
                                onPress={() => handleToggleStatus(u)}
                            >
                                <Ionicons
                                    name={
                                        u.isActive
                                            ? 'checkmark-circle-outline'
                                            : 'close-circle-outline'
                                    }
                                    size={20}
                                    color={u.isActive ? '#4CAF50' : '#9E9E9E'}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.actionButton, styles.deleteButton]}
                                onPress={() => handleDeleteUser(u)}
                            >
                                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                            </TouchableOpacity>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            <Modal
                visible={!!selectedUser}
                transparent
                animationType="fade"
                onRequestClose={() => setSelectedUser(null)}
            >
                <View style={styles.detailOverlay}>
                    <View style={styles.detailSheet}>
                        <View style={styles.detailHeader}>
                            <Text style={styles.detailTitle}>
                                {selectedUser?.role === 'worker' ? 'Worker Details' : 'Customer Details'}
                            </Text>
                            <TouchableOpacity onPress={() => setSelectedUser(null)}>
                                <Ionicons name="close" size={22} color={Colors.text} />
                            </TouchableOpacity>
                        </View>
                        {selectedUser && <UserDetail user={selectedUser} />}
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

function UserDetail({ user }: { user: UserRow }) {
    const u = user.raw || {};
    const address =
        u?.addresses?.[0]?.address ||
        u?.location?.address ||
        u?.address ||
        '—';
    const rows: { icon: any; label: string; value: string }[] = [
        { icon: 'person-outline', label: 'Name', value: u.name || '—' },
        { icon: 'mail-outline', label: 'Email', value: u.email || '—' },
        { icon: 'call-outline', label: 'Phone', value: u.phone || '—' },
        { icon: 'location-outline', label: 'Address', value: address },
    ];
    if (user.role === 'worker') {
        const isVerified =
            u.verified ||
            u.nicVerified ||
            u.idProof?.verificationStatus === 'Verified';
        rows.push(
            { icon: 'briefcase-outline', label: 'Category', value: u.category || '—' },
            { icon: 'time-outline', label: 'Experience', value: u.experience ? `${u.experience} years` : '—' },
            { icon: 'star-outline', label: 'Rating', value: String(u.rating ?? 0) },
            { icon: 'checkmark-done-outline', label: 'Jobs Done', value: String(u.jobsCompleted ?? 0) },
            { icon: 'shield-checkmark-outline', label: 'Verified', value: isVerified ? 'Yes' : 'No' },
        );
    }
    return (
        <ScrollView style={{ maxHeight: 460 }}>
            <View style={styles.detailAvatar}>
                <Text style={styles.detailAvatarText}>{(u.name || '?').charAt(0)}</Text>
            </View>
            <Text style={styles.detailName}>{u.name || '—'}</Text>
            <Text style={styles.detailRole}>
                {user.role === 'worker' ? u.category || 'Worker' : 'Customer'}
            </Text>
            <View style={{ height: 12 }} />
            {rows.map((r) => (
                <View key={r.label} style={styles.detailRow}>
                    <Ionicons name={r.icon} size={18} color={Colors.primary} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.detailLabel}>{r.label}</Text>
                        <Text style={styles.detailValue}>{r.value}</Text>
                    </View>
                </View>
            ))}
        </ScrollView>
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
    userCardDisabled: {
        opacity: 0.55,
    },
    avatarContainerDisabled: {
        backgroundColor: '#9E9E9E',
    },
    userNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap',
        marginBottom: 4,
    },
    disabledBadge: {
        fontSize: 10,
        fontWeight: '700',
        color: '#C62828',
        backgroundColor: '#FFEBEE',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        textTransform: 'uppercase',
    },
    statusButtonInactive: {
        backgroundColor: '#9E9E9E' + '20',
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
    detailOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    detailSheet: {
        backgroundColor: Colors.card,
        borderRadius: 16,
        padding: 20,
        width: '100%',
        maxWidth: 420,
    },
    detailHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    detailTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
    },
    detailAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginBottom: 10,
    },
    detailAvatarText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: Colors.background,
    },
    detailName: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        textAlign: 'center',
    },
    detailRole: {
        fontSize: 13,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 2,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    detailLabel: {
        fontSize: 11,
        color: Colors.textSecondary,
    },
    detailValue: {
        fontSize: 14,
        color: Colors.text,
        fontWeight: '500',
        marginTop: 2,
    },
});
