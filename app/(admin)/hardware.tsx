import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

declare const global: any;

interface HardwareItem {
    _id: string;
    name: string;
    category: string;
    price: number;
    unit: string;
    description?: string;
    inStock: boolean;
    createdAt: string;
}

interface HardwareRequest {
    _id: string;
    jobId: { _id: string; serviceType: string; status: string };
    workerId: { _id: string; name: string; phone: string };
    customerId: { _id: string; name: string; phone: string };
    totalCost: number;
    status: 'pending' | 'approved' | 'rejected' | 'delivered';
    createdAt: string;
    items: Array<{ name: string; quantity: number; price: number }>;
}

export default function HardwareShop() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'inventory' | 'requests'>('inventory');
    const [items, setItems] = useState<HardwareItem[]>([]);
    const [requests, setRequests] = useState<HardwareRequest[]>([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingItem, setEditingItem] = useState<HardwareItem | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [requestsFilter, setRequestsFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'delivered'>('all');

    const [formData, setFormData] = useState({
        name: '',
        category: 'Plumbing',
        price: '',
        unit: 'piece',
        description: '',
    });

    const categories = ['Plumbing', 'Electrical', 'Carpentry', 'General'];
    const units = ['piece', 'meter', 'kg', 'liter', 'box'];

    useEffect(() => {
        if (!global.adminToken) {
            Alert.alert('Error', 'You must be logged in as admin to access this page');
            router.back();
            return;
        }

        if (activeTab === 'inventory') {
            fetchHardwareItems();
        } else {
            fetchHardwareRequests();
        }
    }, [activeTab, selectedCategory, requestsFilter]);

    const fetchHardwareItems = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `http://localhost:5000/api/hardware/admin/items${selectedCategory ? `?category=${selectedCategory}` : ''}`,
                {
                    headers: {
                        'Authorization': `Bearer ${global.adminToken}`,
                    },
                }
            );
            const data = await response.json();
            if (data.success) {
                setItems(data.data);
            }
        } catch (error) {
            console.error('Error fetching items:', error);
            Alert.alert('Error', 'Failed to load hardware items');
        } finally {
            setLoading(false);
        }
    };

    const fetchHardwareRequests = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `http://localhost:5000/api/hardware/admin/requests${requestsFilter !== 'all' ? `?status=${requestsFilter}` : ''}`,
                {
                    headers: {
                        'Authorization': `Bearer ${global.adminToken}`,
                    },
                }
            );
            const data = await response.json();
            if (data.success) {
                setRequests(data.data);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
            Alert.alert('Error', 'Failed to load hardware requests');
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = () => {
        setEditingItem(null);
        setFormData({
            name: '',
            category: 'Plumbing',
            price: '',
            unit: 'piece',
            description: '',
        });
        setModalVisible(true);
    };

    const handleEditItem = (item: HardwareItem) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            category: item.category,
            price: item.price.toString(),
            unit: item.unit,
            description: item.description || '',
        });
        setModalVisible(true);
    };

    const handleSaveItem = async () => {
        if (!formData.name || !formData.price) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        try {
            const method = editingItem ? 'PUT' : 'POST';
            const url = editingItem
                ? `http://localhost:5000/api/hardware/admin/items/${editingItem._id}`
                : 'http://localhost:5000/api/hardware/admin/items';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${global.adminToken}`,
                },
                body: JSON.stringify({
                    ...formData,
                    price: parseFloat(formData.price),
                }),
            });

            const data = await response.json();
            if (data.success) {
                Alert.alert('Success', editingItem ? 'Item updated successfully' : 'Item created successfully');
                setModalVisible(false);
                fetchHardwareItems();
            } else {
                Alert.alert('Error', data.message || 'Failed to save item');
            }
        } catch (error) {
            console.error('Error saving item:', error);
            Alert.alert('Error', 'Failed to save item');
        }
    };

    const handleDeleteItem = async (itemId: string) => {
        Alert.alert('Confirm Delete', 'Are you sure you want to delete this item?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    try {
                        const response = await fetch(
                            `http://localhost:5000/api/hardware/admin/items/${itemId}`,
                            {
                                method: 'DELETE',
                                headers: {
                                    'Authorization': `Bearer ${global.adminToken}`,
                                },
                            }
                        );
                        const data = await response.json();
                        if (data.success) {
                            Alert.alert('Success', 'Item deleted successfully');
                            fetchHardwareItems();
                        }
                    } catch (error) {
                        Alert.alert('Error', 'Failed to delete item');
                    }
                },
            },
        ]);
    };

    const handleToggleStock = async (itemId: string, currentStock: boolean) => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/hardware/admin/items/${itemId}/stock`,
                {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${global.adminToken}`,
                    },
                    body: JSON.stringify({ inStock: !currentStock }),
                }
            );
            const data = await response.json();
            if (data.success) {
                fetchHardwareItems();
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to update stock status');
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderHardwareItem = ({ item }: { item: HardwareItem }) => (
        <View style={styles.itemCard}>
            <View style={styles.itemHeader}>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.itemMeta}>
                        <Text style={styles.categoryBadge}>{item.category}</Text>
                        <Text style={styles.unitText}>{item.unit}</Text>
                    </View>
                </View>
                <View style={[styles.stockBadge, { backgroundColor: item.inStock ? '#4CAF50' : '#FF6B6B' }]}>
                    <Text style={styles.stockText}>{item.inStock ? 'In Stock' : 'Out'}</Text>
                </View>
            </View>

            <View style={styles.itemDetails}>
                <Text style={styles.priceText}>₹{item.price}/{item.unit}</Text>
                {item.description && (
                    <Text style={styles.descriptionText} numberOfLines={2}>{item.description}</Text>
                )}
            </View>

            <View style={styles.itemActions}>
                <TouchableOpacity
                    onPress={() => handleToggleStock(item._id, item.inStock)}
                    style={[styles.actionBtn, { backgroundColor: item.inStock ? '#FF9800' : '#4CAF50' }]}
                >
                    <Ionicons
                        name={item.inStock ? 'checkmark-outline' : 'arrow-redo-outline'}
                        size={18}
                        color="#fff"
                    />
                    <Text style={styles.actionBtnText}>{item.inStock ? 'In Stock' : 'Out'}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => handleEditItem(item)}
                    style={[styles.actionBtn, { backgroundColor: Colors.primary }]}
                >
                    <Ionicons name="create-outline" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => handleDeleteItem(item._id)}
                    style={[styles.actionBtn, { backgroundColor: '#ff6b6b' }]}
                >
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Delete</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderHardwareRequest = ({ item }: { item: HardwareRequest }) => (
        <View style={styles.requestCard}>
            <View style={styles.requestHeader}>
                <View>
                    <Text style={styles.requestTitle}>Order #{item._id.slice(-6)}</Text>
                    <Text style={styles.requestSubtitle}>{item.jobId.serviceType}</Text>
                </View>
                <View
                    style={[
                        styles.statusBadge,
                        {
                            backgroundColor:
                                item.status === 'pending' ? '#FF9800' :
                                item.status === 'approved' ? '#4CAF50' :
                                item.status === 'delivered' ? '#2196F3' : '#FF6B6B',
                        },
                    ]}
                >
                    <Text style={styles.statusText}>{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</Text>
                </View>
            </View>

            <View style={styles.requestDetails}>
                <Text style={styles.requestLabel}>Worker: <Text style={styles.requestValue}>{item.workerId.name}</Text></Text>
                <Text style={styles.requestLabel}>Customer: <Text style={styles.requestValue}>{item.customerId.name}</Text></Text>
                <Text style={styles.requestLabel}>Total Cost: <Text style={styles.costText}>₹{item.totalCost.toFixed(2)}</Text></Text>
                <Text style={styles.requestLabel}>Items: <Text style={styles.requestValue}>{item.items.length} item(s)</Text></Text>
            </View>

            <View style={styles.itemsList}>
                {item.items.map((subItem, idx) => (
                    <Text key={idx} style={styles.subItem}>
                        • {subItem.name} x{subItem.quantity} (₹{subItem.price})
                    </Text>
                ))}
            </View>

            <View style={styles.requestFooter}>
                <Text style={styles.dateText}>
                    {new Date(item.createdAt).toLocaleDateString()}
                </Text>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View>
                    <Text style={styles.heading}>Hardware Shop</Text>
                    <Text style={styles.subheading}>Manage inventory & orders</Text>
                </View>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close-circle-outline" size={28} color={Colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'inventory' && styles.activeTab]}
                    onPress={() => setActiveTab('inventory')}
                >
                    <Ionicons name="cube-outline" size={20} color={activeTab === 'inventory' ? Colors.primary : Colors.textSecondary} />
                    <Text style={[styles.tabText, activeTab === 'inventory' && styles.activeTabText]}>
                        Inventory
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
                    onPress={() => setActiveTab('requests')}
                >
                    <Ionicons name="receipt-outline" size={20} color={activeTab === 'requests' ? Colors.primary : Colors.textSecondary} />
                    <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                        Orders
                    </Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'inventory' ? (
                <ScrollView style={styles.content}>
                    {/* Add Item Button */}
                    <TouchableOpacity
                        style={styles.addButton}
                        onPress={handleAddItem}
                    >
                        <Ionicons name="add-circle" size={24} color="#fff" />
                        <Text style={styles.addButtonText}>Add New Item</Text>
                    </TouchableOpacity>

                    {/* Filters */}
                    <View style={styles.filterSection}>
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Search items..."
                            placeholderTextColor={Colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            style={styles.categoryFilter}
                        >
                            <TouchableOpacity
                                style={[styles.filterChip, !selectedCategory && styles.activeFilterChip]}
                                onPress={() => setSelectedCategory(null)}
                            >
                                <Text style={[styles.filterChipText, !selectedCategory && styles.activeFilterChipText]}>
                                    All
                                </Text>
                            </TouchableOpacity>
                            {categories.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[styles.filterChip, selectedCategory === cat && styles.activeFilterChip]}
                                    onPress={() => setSelectedCategory(cat)}
                                >
                                    <Text style={[styles.filterChipText, selectedCategory === cat && styles.activeFilterChipText]}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Items List */}
                    {loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    ) : filteredItems.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="cube-outline" size={48} color={Colors.textSecondary} />
                            <Text style={styles.emptyText}>No items found</Text>
                        </View>
                    ) : (
                        <FlatList
                            scrollEnabled={false}
                            data={filteredItems}
                            renderItem={renderHardwareItem}
                            keyExtractor={item => item._id}
                            contentContainerStyle={styles.listContent}
                        />
                    )}
                </ScrollView>
            ) : (
                <ScrollView style={styles.content}>
                    {/* Requests Filter */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.requestFilter}
                    >
                        {['all', 'pending', 'approved', 'rejected', 'delivered'].map(status => (
                            <TouchableOpacity
                                key={status}
                                style={[styles.filterChip, requestsFilter === status as any && styles.activeFilterChip]}
                                onPress={() => setRequestsFilter(status as any)}
                            >
                                <Text style={[styles.filterChipText, requestsFilter === status as any && styles.activeFilterChipText]}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Requests List */}
                    {loading ? (
                        <View style={styles.centerContainer}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    ) : requests.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="receipt-outline" size={48} color={Colors.textSecondary} />
                            <Text style={styles.emptyText}>No requests found</Text>
                        </View>
                    ) : (
                        <FlatList
                            scrollEnabled={false}
                            data={requests}
                            renderItem={renderHardwareRequest}
                            keyExtractor={item => item._id}
                            contentContainerStyle={styles.listContent}
                        />
                    )}
                </ScrollView>
            )}

            {/* Add/Edit Modal */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <SafeAreaView style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>
                                {editingItem ? 'Edit Item' : 'Add New Item'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={28} color={Colors.primary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalForm}>
                            <Text style={styles.label}>Item Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g., PVC Pipe (1 inch)"
                                placeholderTextColor={Colors.textSecondary}
                                value={formData.name}
                                onChangeText={(text) => setFormData({ ...formData, name: text })}
                            />

                            <Text style={styles.label}>Category *</Text>
                            <View style={styles.pickerContainer}>
                                {categories.map(cat => (
                                    <TouchableOpacity
                                        key={cat}
                                        style={[
                                            styles.pickerOption,
                                            formData.category === cat && styles.pickerOptionActive,
                                        ]}
                                        onPress={() => setFormData({ ...formData, category: cat })}
                                    >
                                        <Text style={[
                                            styles.pickerOptionText,
                                            formData.category === cat && styles.pickerOptionTextActive,
                                        ]}>
                                            {cat}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Price (₹) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="0.00"
                                placeholderTextColor={Colors.textSecondary}
                                keyboardType="decimal-pad"
                                value={formData.price}
                                onChangeText={(text) => setFormData({ ...formData, price: text })}
                            />

                            <Text style={styles.label}>Unit</Text>
                            <View style={styles.pickerContainer}>
                                {units.map(unit => (
                                    <TouchableOpacity
                                        key={unit}
                                        style={[
                                            styles.pickerOption,
                                            formData.unit === unit && styles.pickerOptionActive,
                                        ]}
                                        onPress={() => setFormData({ ...formData, unit })}
                                    >
                                        <Text style={[
                                            styles.pickerOptionText,
                                            formData.unit === unit && styles.pickerOptionTextActive,
                                        ]}>
                                            {unit}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            <Text style={styles.label}>Description</Text>
                            <TextInput
                                style={[styles.input, styles.textArea]}
                                placeholder="Item description..."
                                placeholderTextColor={Colors.textSecondary}
                                multiline
                                numberOfLines={4}
                                value={formData.description}
                                onChangeText={(text) => setFormData({ ...formData, description: text })}
                            />

                            <View style={styles.modalActions}>
                                <TouchableOpacity
                                    style={[styles.button, styles.cancelButton]}
                                    onPress={() => setModalVisible(false)}
                                >
                                    <Text style={styles.cancelButtonText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.button, styles.saveButton]}
                                    onPress={handleSaveItem}
                                >
                                    <Text style={styles.saveButtonText}>
                                        {editingItem ? 'Update' : 'Create'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: Colors.card,
    },
    heading: {
        fontSize: 24,
        fontWeight: 'bold',
        color: Colors.text,
    },
    subheading: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: Colors.card,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        gap: 6,
    },
    activeTab: {
        borderBottomWidth: 3,
        borderBottomColor: Colors.primary,
    },
    tabText: {
        fontSize: 14,
        color: Colors.textSecondary,
        fontWeight: '500',
    },
    activeTabText: {
        color: Colors.primary,
    },
    content: {
        flex: 1,
        padding: 12,
    },
    addButton: {
        backgroundColor: Colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 14,
        borderRadius: 10,
        marginBottom: 16,
        gap: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    filterSection: {
        marginBottom: 16,
    },
    searchInput: {
        backgroundColor: Colors.card,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: Colors.text,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    categoryFilter: {
        marginBottom: 12,
    },
    filterChip: {
        backgroundColor: Colors.card,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    activeFilterChip: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    filterChipText: {
        fontSize: 12,
        color: Colors.text,
        fontWeight: '500',
    },
    activeFilterChipText: {
        color: '#fff',
    },
    requestFilter: {
        marginBottom: 12,
        paddingVertical: 8,
    },
    listContent: {
        paddingBottom: 16,
    },
    itemCard: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 10,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    itemMeta: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 6,
    },
    categoryBadge: {
        backgroundColor: Colors.primary + '20',
        color: Colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        fontSize: 12,
        fontWeight: '500',
    },
    unitText: {
        backgroundColor: '#F5F5F5',
        color: Colors.text,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
        fontSize: 12,
    },
    stockBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    stockText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    itemDetails: {
        marginBottom: 10,
    },
    priceText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: Colors.primary,
    },
    descriptionText: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 4,
    },
    itemActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
        paddingHorizontal: 6,
        borderRadius: 6,
        gap: 4,
    },
    actionBtnText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    requestCard: {
        backgroundColor: Colors.card,
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    requestHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    requestTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: Colors.text,
    },
    requestSubtitle: {
        fontSize: 12,
        color: Colors.textSecondary,
        marginTop: 2,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 6,
    },
    statusText: {
        color: '#fff',
        fontSize: 11,
        fontWeight: '600',
    },
    requestDetails: {
        marginBottom: 10,
    },
    requestLabel: {
        fontSize: 12,
        color: Colors.text,
        marginBottom: 4,
        fontWeight: '500',
    },
    requestValue: {
        color: Colors.textSecondary,
        fontWeight: '400',
    },
    costText: {
        color: Colors.primary,
        fontWeight: '600',
    },
    itemsList: {
        backgroundColor: Colors.background,
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
    },
    subItem: {
        fontSize: 11,
        color: Colors.text,
        marginBottom: 4,
    },
    requestFooter: {
        borderTopWidth: 1,
        borderTopColor: Colors.border,
        paddingTop: 8,
    },
    dateText: {
        fontSize: 11,
        color: Colors.textSecondary,
    },
    centerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 16,
        color: Colors.textSecondary,
        marginTop: 12,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    modalContent: {
        flex: 1,
        backgroundColor: Colors.card,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: Colors.text,
    },
    modalForm: {
        flex: 1,
        padding: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
        marginBottom: 8,
    },
    input: {
        backgroundColor: Colors.background,
        borderRadius: 10,
        paddingHorizontal: 12,
        paddingVertical: 10,
        color: Colors.text,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    pickerContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    pickerOption: {
        backgroundColor: Colors.background,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    pickerOptionActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    pickerOptionText: {
        fontSize: 13,
        color: Colors.text,
        fontWeight: '500',
    },
    pickerOptionTextActive: {
        color: '#fff',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 16,
        marginBottom: 40,
    },
    button: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: Colors.background,
        borderWidth: 1,
        borderColor: Colors.border,
    },
    cancelButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.text,
    },
    saveButton: {
        backgroundColor: Colors.primary,
    },
    saveButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});
