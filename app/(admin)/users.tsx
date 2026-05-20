import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { api, apiCall, resolveMediaUrl } from '../../constants/api';
import { useStore } from '../../constants/Store';

type UserRow = {
    id: string;
    name: string;
    role: 'worker' | 'customer';
    subtitle: string;
    rating?: number;
    jobsCompleted?: number;
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
            raw: w,
        }));
        const customerRows: UserRow[] = customers.map((c: any) => ({
            id: c.id || c._id,
            name: c.name || '—',
            role: 'customer',
            subtitle: c.email || c.phone || 'Customer',
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
                        style={styles.userCard}
                        activeOpacity={0.7}
                        onPress={() => setSelectedUser(u)}
                    >
                        <View style={styles.userInfo}>
                            <View style={styles.avatarContainer}>
                                <Text style={styles.avatarText}>{u.name.charAt(0)}</Text>
                            </View>
                            <View style={styles.userDetails}>
                                <Text style={styles.userName}>{u.name}</Text>
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
    const [previewImage, setPreviewImage] = useState<string | null>(null);
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

    const experienceDocs: any[] =
        user.role === 'worker' && Array.isArray(u.experienceDocuments)
            ? u.experienceDocuments
            : [];
    const educationDocs: any[] =
        user.role === 'worker' && Array.isArray(u.educationDocuments)
            ? u.educationDocuments
            : [];

    const formatDate = (d: any) => {
        if (!d) return '';
        const date = new Date(d);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleDateString('en-GB', {
            month: 'short',
            year: 'numeric',
        });
    };

    const openCertificate = async (url?: string) => {
        if (!url) {
            Alert.alert('Unavailable', 'Certificate URL is not available.');
            return;
        }
        const resolvedUrl = resolveMediaUrl(url);
        if (isImageUrl(resolvedUrl)) {
            setPreviewImage(resolvedUrl);
            return;
        }
        try {
            await WebBrowser.openBrowserAsync(resolvedUrl);
        } catch {
            try {
                await Linking.openURL(resolvedUrl);
            } catch {
                Alert.alert('Error', 'Failed to open certificate.');
            }
        }
    };

    return (
        <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
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

            {user.role === 'worker' && experienceDocs.length > 0 && (
                <View style={styles.docSection}>
                    <Text style={styles.docSectionTitle}>Experience</Text>
                    {experienceDocs.map((doc, i) => {
                        const period = [formatDate(doc.issueDate), formatDate(doc.expiryDate)]
                            .filter(Boolean)
                            .join(' – ');
                        return (
                            <DocCard
                                key={i}
                                title={doc.title || doc.name || 'Experience'}
                                accent={doc.description || doc.name}
                                period={period}
                                docType={doc.documentType}
                                url={doc.url}
                                onOpen={openCertificate}
                            />
                        );
                    })}
                </View>
            )}

            {user.role === 'worker' && educationDocs.length > 0 && (
                <View style={styles.docSection}>
                    <Text style={styles.docSectionTitle}>Education</Text>
                    {educationDocs.map((doc, i) => {
                        const period = [formatDate(doc.startDate), formatDate(doc.endDate)]
                            .filter(Boolean)
                            .join(' – ');
                        return (
                            <DocCard
                                key={i}
                                title={doc.name || 'Education'}
                                accent={doc.institution || doc.description}
                                period={period}
                                docType={doc.documentType}
                                url={doc.url}
                                onOpen={openCertificate}
                            />
                        );
                    })}
                </View>
            )}

            <Modal visible={!!previewImage} animationType="fade" transparent>
                <TouchableOpacity
                    style={styles.imagePreviewOverlay}
                    activeOpacity={1}
                    onPress={() => setPreviewImage(null)}
                >
                    {previewImage ? (
                        <Image
                            source={{ uri: previewImage }}
                            style={styles.imagePreview}
                            resizeMode="contain"
                        />
                    ) : null}
                    <Text style={styles.imagePreviewHint}>Tap anywhere to close</Text>
                </TouchableOpacity>
            </Modal>
        </ScrollView>
    );
}

function isImageUrl(uri: string): boolean {
    if (!uri) return false;
    const lower = uri.toLowerCase().split('?')[0];
    return (
        lower.endsWith('.jpg') ||
        lower.endsWith('.jpeg') ||
        lower.endsWith('.png') ||
        lower.endsWith('.gif') ||
        lower.endsWith('.webp') ||
        lower.endsWith('.heic')
    );
}

function getFilename(uri: string): string {
    if (!uri) return 'Document';
    const seg = uri.split('?')[0].split('/').pop() || 'Document';
    try {
        return decodeURIComponent(seg);
    } catch {
        return seg;
    }
}

function DocCard({
    title,
    accent,
    period,
    docType,
    url,
    onOpen,
}: {
    title: string;
    accent?: string;
    period?: string;
    docType?: string;
    url?: string;
    onOpen: (url?: string) => void;
}) {
    return (
        <View style={styles.docCard}>
            <Text style={styles.docTitle} numberOfLines={2}>{title}</Text>
            {!!accent && (
                <Text style={styles.docAccent} numberOfLines={2}>{accent}</Text>
            )}
            {!!period && <Text style={styles.docMeta}>{period}</Text>}
            {!!docType && <Text style={styles.docMeta}>{docType}</Text>}
            {!!url && (
                <TouchableOpacity
                    style={styles.docPreviewWrap}
                    activeOpacity={0.85}
                    onPress={() => onOpen(url)}
                >
                    {isImageUrl(url) ? (
                        <Image
                            source={{ uri: resolveMediaUrl(url) }}
                            style={styles.docPreviewImage}
                            resizeMode="contain"
                        />
                    ) : (
                        <View style={styles.docPreviewFile}>
                            <Ionicons name="document-text" size={48} color={Colors.primary} />
                            <Text style={styles.docPreviewFileName} numberOfLines={1}>
                                {getFilename(url)}
                            </Text>
                        </View>
                    )}
                    <Text style={styles.docTapHint}>Tap to view</Text>
                </TouchableOpacity>
            )}
        </View>
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
    docSection: {
        marginTop: 16,
    },
    docSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: Colors.text,
        marginBottom: 10,
    },
    docCard: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 14,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    docTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: Colors.text,
    },
    docAccent: {
        fontSize: 14,
        color: Colors.primary,
        fontWeight: '600',
        marginTop: 2,
    },
    docMeta: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    docPreviewWrap: {
        marginTop: 12,
        alignItems: 'center',
    },
    docPreviewImage: {
        width: '100%',
        height: 220,
        borderRadius: 8,
        backgroundColor: Colors.background,
    },
    docPreviewFile: {
        width: '100%',
        height: 140,
        borderRadius: 8,
        backgroundColor: Colors.background,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    docPreviewFileName: {
        fontSize: 12,
        color: Colors.text,
        maxWidth: '80%',
    },
    docTapHint: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    imagePreviewOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.92)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    imagePreview: {
        width: '100%',
        height: '80%',
    },
    imagePreviewHint: {
        color: '#fff',
        marginTop: 20,
        fontSize: 13,
    },
});
