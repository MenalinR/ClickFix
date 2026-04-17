import { api, apiCall } from "@/constants/api";
import { Colors } from "@/constants/Colors";
import { useStore } from "@/constants/Store";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface HardwareItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  inStock: boolean;
  description?: string;
}

export default function InventoryScreen() {
  const { token } = useStore();
  const [items, setItems] = useState<HardwareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [category, setCategory] = useState("General");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState("piece");
  const [description, setDescription] = useState("");
  const [inStock, setInStock] = useState(true);

  const categories = ["Plumbing", "Electrical", "Carpentry", "General"];
  const units = ["piece", "meter", "kg", "liter", "box"];

  const fetchItems = async () => {
    try {
      if (!token) return;
      const response = await apiCall(api.hardwareShop.getItems, "GET", undefined, token);
      if (response.success) {
        setItems(response.data);
      }
    } catch (error) {
      console.error("Error fetching items:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchItems();
    }, [token])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  }, [token]);

  const resetForm = () => {
    setName("");
    setCategory("General");
    setPrice("");
    setUnit("piece");
    setDescription("");
    setInStock(true);
    setIsEditing(false);
    setEditingId(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (item: HardwareItem) => {
    setName(item.name);
    setCategory(item.category);
    setPrice(item.price.toString());
    setUnit(item.unit);
    setDescription(item.description || "");
    setInStock(item.inStock);
    setIsEditing(true);
    setEditingId(item._id);
    setModalVisible(true);
  };

  const handleSaveItem = async () => {
    if (!name.trim() || !price.trim()) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    try {
      const itemData = {
        name: name.trim(),
        category,
        price: parseFloat(price),
        unit,
        description: description.trim(),
        inStock,
      };

      if (isEditing && editingId) {
        await apiCall(
          api.hardwareShop.updateItem(editingId),
          "PUT",
          itemData,
          token
        );
        Alert.alert("Success", "Item updated successfully");
      } else {
        await apiCall(
          api.hardwareShop.addItem,
          "POST",
          itemData,
          token
        );
        Alert.alert("Success", "Item added successfully");
      }

      setModalVisible(false);
      resetForm();
      await fetchItems();
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to save item");
    }
  };

  const handleDeleteItem = (itemId: string) => {
    Alert.alert("Delete Item", "Are you sure you want to delete this item?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await apiCall(
              api.hardwareShop.deleteItem(itemId),
              "DELETE",
              undefined,
              token
            );
            Alert.alert("Success", "Item deleted successfully");
            await fetchItems();
          } catch (error: any) {
            Alert.alert("Error", error.message || "Failed to delete item");
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: HardwareItem }) => (
    <View style={styles.itemCard}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemCategory}>{item.category}</Text>
        <View style={styles.itemDetails}>
          <Text style={styles.itemPrice}>₹{item.price}</Text>
          <Text style={styles.itemUnit}>({item.unit})</Text>
          <View
            style={[
              styles.stockBadge,
              { backgroundColor: item.inStock ? "#4CAF50" : "#f44336" },
            ]}
          >
            <Text style={styles.stockText}>
              {item.inStock ? "In Stock" : "Out of Stock"}
            </Text>
          </View>
        </View>
      </View>
      <View style={styles.itemActions}>
        <Pressable
          style={styles.iconButton}
          onPress={() => openEditModal(item)}
        >
          <Ionicons name="pencil" size={20} color={Colors.primary} />
        </Pressable>
        <Pressable
          style={styles.iconButton}
          onPress={() => handleDeleteItem(item._id)}
        >
          <Ionicons name="trash" size={20} color="#f44336" />
        </Pressable>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Inventory</Text>
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && { opacity: 0.7 },
          ]}
          onPress={openAddModal}
        >
          <Ionicons name="add" size={24} color="white" />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="cube-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No items yet</Text>
          <Text style={styles.emptySubtext}>Add your first hardware item</Text>
          <Pressable
            style={styles.emptyButton}
            onPress={openAddModal}
          >
            <Text style={styles.emptyButtonText}>Add Item</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelButton}>Cancel</Text>
            </Pressable>
            <Text style={styles.modalTitle}>
              {isEditing ? "Edit Item" : "Add Item"}
            </Text>
            <Pressable onPress={handleSaveItem}>
              <Text style={styles.saveButton}>Save</Text>
            </Pressable>
          </View>

          <View style={styles.formContent}>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Item Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., PVC Pipe 1 inch"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Category *</Text>
              <View style={styles.pickerRow}>
                {categories.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.categoryButton,
                      category === cat && styles.categoryButtonActive,
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.categoryButtonText,
                        category === cat && styles.categoryButtonTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Price *</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={price}
                onChangeText={setPrice}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Unit</Text>
              <View style={styles.pickerRow}>
                {units.map((u) => (
                  <Pressable
                    key={u}
                    style={[
                      styles.unitButton,
                      unit === u && styles.unitButtonActive,
                    ]}
                    onPress={() => setUnit(u)}
                  >
                    <Text
                      style={[
                        styles.unitButtonText,
                        unit === u && styles.unitButtonTextActive,
                      ]}
                    >
                      {u}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Add details about this item"
                multiline
                numberOfLines={3}
                value={description}
                onChangeText={setDescription}
              />
            </View>

            <View style={styles.formGroup}>
              <Pressable
                style={[
                  styles.stockToggle,
                  inStock && { backgroundColor: "#e8f5e9" },
                ]}
                onPress={() => setInStock(!inStock)}
              >
                <Ionicons
                  name={inStock ? "checkmark-circle" : "close-circle"}
                  size={24}
                  color={inStock ? "#4CAF50" : "#f44336"}
                />
                <Text style={styles.stockToggleText}>
                  {inStock ? "In Stock" : "Out of Stock"}
                </Text>
              </Pressable>
            </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 16,
  },
  itemCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: 4,
  },
  itemCategory: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  itemDetails: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  itemPrice: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  itemUnit: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  stockBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  stockText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "white",
  },
  itemActions: {
    flexDirection: "row",
    gap: 8,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 8,
  },
  emptyButton: {
    marginTop: 24,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "white",
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelButton: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  saveButton: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  formContent: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  textArea: {
    textAlignVertical: "top",
    minHeight: 80,
  },
  pickerRow: {
    flexDirection: "row",
    gap: 8,
    flexWrap: "wrap",
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryButtonText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  categoryButtonTextActive: {
    color: "white",
  },
  unitButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  unitButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  unitButtonText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  unitButtonTextActive: {
    color: "white",
  },
  stockToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#fff3e0",
  },
  stockToggleText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
});
