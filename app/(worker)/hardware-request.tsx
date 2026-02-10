import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";

interface HardwareItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  description: string;
  emoji: string;
}

export default function HardwareRequestPage() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams();
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);

  const hardwareItems: HardwareItem[] = [
    {
      id: "1",
      name: "PVC Pipe (1 inch)",
      category: "Plumbing",
      price: 450,
      quantity: 0,
      description: "High-quality PVC pipe for water lines",
      emoji: "🔧",
    },
    {
      id: "2",
      name: "Pipe Fitting",
      category: "Plumbing",
      price: 200,
      quantity: 0,
      description: "90-degree elbow joint",
      emoji: "⚙️",
    },
    {
      id: "3",
      name: "Copper Wire (1kg)",
      category: "Electrical",
      price: 800,
      quantity: 0,
      description: "Flexible copper wire for electrical work",
      emoji: "⚡",
    },
    {
      id: "4",
      name: "Circuit Breaker",
      category: "Electrical",
      price: 2500,
      quantity: 0,
      description: "32A main circuit breaker",
      emoji: "🔌",
    },
    {
      id: "5",
      name: "Wood Screws (Box)",
      category: "Carpentry",
      price: 150,
      quantity: 0,
      description: "Assorted wood screws",
      emoji: "📦",
    },
    {
      id: "6",
      name: "Door Handle",
      category: "Carpentry",
      price: 600,
      quantity: 0,
      description: "Modern stainless steel door handle",
      emoji: "🚪",
    },
  ];

  const [items, setItems] = useState<HardwareItem[]>(hardwareItems);

  const toggleItemSelection = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((item) => item !== id));
    } else {
      setSelectedItems([...selectedItems, id]);
    }
  };

  const updateQuantity = (id: string, qty: number) => {
    setItems(
      items.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(0, qty) } : item,
      ),
    );
  };

  const getTotalPrice = () => {
    return items
      .filter((item) => selectedItems.includes(item.id))
      .reduce((acc, item) => acc + item.price * Math.max(item.quantity, 1), 0);
  };

  const handleSendRequest = () => {
    const requestedItems = items.filter((item) =>
      selectedItems.includes(item.id),
    );
    if (requestedItems.length === 0) {
      Alert.alert("Error", "Please select at least one item");
      return;
    }

    const totalPrice = getTotalPrice();
    Alert.alert(
      "Confirm Request",
      `Send request for ${requestedItems.length} item(s) totaling ${totalPrice} LKR?`,
      [
        { text: "Cancel", onPress: () => {}, style: "cancel" },
        {
          text: "Send Request",
          onPress: () => {
            Alert.alert(
              "Success",
              "Hardware request sent to customer for approval!",
            );
            setSelectedItems([]);
            setItems(items.map((item) => ({ ...item, quantity: 0 })));
          },
        },
      ],
    );
  };

  const categorizedItems = items.reduce(
    (acc, item) => {
      const existing = acc.find((group) => group.category === item.category);
      if (existing) {
        existing.items.push(item);
      } else {
        acc.push({ category: item.category, items: [item] });
      }
      return acc;
    },
    [] as Array<{ category: string; items: HardwareItem[] }>,
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.heading}>Hardware Request</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.infoText}>
            Select the parts you need. Customer will approve before purchase.
          </Text>
        </View>

        {/* Hardware Items by Category */}
        {categorizedItems.map((category) => (
          <View key={category.category} style={styles.categorySection}>
            <Text style={styles.categoryTitle}>{category.category}</Text>

            {category.items.map((item) => {
              const isSelected = selectedItems.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.itemCard,
                    isSelected && styles.itemCardSelected,
                  ]}
                  onPress={() => toggleItemSelection(item.id)}
                >
                  <View style={styles.itemLeft}>
                    <Text style={styles.emoji}>{item.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.name}</Text>
                      <Text style={styles.itemDescription}>
                        {item.description}
                      </Text>
                      <Text style={styles.itemPrice}>{item.price} LKR</Text>
                    </View>
                  </View>

                  <View style={styles.itemRight}>
                    <View
                      style={[
                        styles.checkbox,
                        isSelected && styles.checkboxSelected,
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>

                    {isSelected && (
                      <View style={styles.quantityControl}>
                        <TouchableOpacity
                          onPress={() =>
                            updateQuantity(item.id, item.quantity - 1)
                          }
                        >
                          <Ionicons
                            name="remove-circle-outline"
                            size={20}
                            color={Colors.primary}
                          />
                        </TouchableOpacity>
                        <Text style={styles.quantityText}>
                          {item.quantity || 1}
                        </Text>
                        <TouchableOpacity
                          onPress={() =>
                            updateQuantity(item.id, item.quantity + 1)
                          }
                        >
                          <Ionicons
                            name="add-circle-outline"
                            size={20}
                            color={Colors.primary}
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Selected Items Summary */}
        {selectedItems.length > 0 && (
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Order Summary</Text>

            {items
              .filter((item) => selectedItems.includes(item.id))
              .map((item) => (
                <View key={item.id} style={styles.summaryItem}>
                  <View>
                    <Text style={styles.summaryItemName}>{item.name}</Text>
                    <Text style={styles.summaryItemQty}>
                      Quantity: {item.quantity || 1}
                    </Text>
                  </View>
                  <Text style={styles.summaryItemPrice}>
                    {item.price * (item.quantity || 1)} LKR
                  </Text>
                </View>
              ))}

            <View style={styles.summaryDivider} />

            <View style={styles.summaryTotal}>
              <Text style={styles.summaryTotalLabel}>Total Cost</Text>
              <Text style={styles.summaryTotalValue}>
                {getTotalPrice()} LKR
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View>
          <Text style={styles.bottomLabel}>
            {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""}{" "}
            selected
          </Text>
          <Text style={styles.bottomPrice}>{getTotalPrice()} LKR</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.sendButton,
            selectedItems.length === 0 && styles.sendButtonDisabled,
          ]}
          onPress={handleSendRequest}
          disabled={selectedItems.length === 0}
        >
          <Ionicons name="send-outline" size={20} color="white" />
          <Text style={styles.sendButtonText}>Send Request</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    alignItems: "center",
    gap: 10,
  },
  infoText: {
    fontSize: 12,
    color: "#1565C0",
    flex: 1,
    lineHeight: 16,
  },
  categorySection: {
    marginBottom: 20,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 12,
    paddingLeft: 4,
  },
  itemCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  itemCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#F0F7FF",
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  emoji: {
    fontSize: 28,
  },
  itemName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  itemDescription: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  itemPrice: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.primary,
    marginTop: 4,
  },
  itemRight: {
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quantityControl: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  quantityText: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.text,
    minWidth: 20,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 12,
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryItemName: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "500",
  },
  summaryItemQty: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  summaryItemPrice: {
    fontSize: 13,
    fontWeight: "bold",
    color: Colors.text,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  summaryTotal: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.text,
  },
  summaryTotalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  bottomLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bottomPrice: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
    marginTop: 4,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  sendButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});
