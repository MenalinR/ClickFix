import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, apiCall } from "../../constants/api";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";

interface Shop {
  _id: string;
  shopName: string;
  city?: string;
  address?: string;
  phone?: string;
}

interface HardwareItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  unit?: string;
  image?: string;
  description?: string;
  inStock?: boolean;
  shopId?: any;
}

interface CartLine {
  hardwareItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  unit?: string;
}

export default function OrderHardwarePage() {
  const router = useRouter();
  const { token } = useStore();
  const params = useLocalSearchParams<{
    jobId?: string;
    customerId?: string;
  }>();
  const jobId = typeof params.jobId === "string" ? params.jobId : "";
  const customerId =
    typeof params.customerId === "string" ? params.customerId : "";

  const [job, setJob] = useState<any>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [shopItems, setShopItems] = useState<HardwareItem[]>([]);
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [loading, setLoading] = useState(false);
  const [loadingItems, setLoadingItems] = useState(false);

  const selectedShop = useMemo(
    () => shops.find((s) => s._id === selectedShopId) || null,
    [shops, selectedShopId],
  );

  // Approved suggestions from chat (read-only reference)
  const approvedSuggestions = useMemo(() => {
    const msgs = (job?.cartMessages || []) as any[];
    return msgs;
  }, [job]);

  useEffect(() => {
    if (!jobId || !token) return;
    (async () => {
      try {
        setLoading(true);
        const [jobRes, shopRes] = await Promise.all([
          apiCall(api.jobs.getById(jobId), "GET", undefined, token),
          apiCall(api.hardwareShop.list, "GET", undefined, token),
        ]);
        setJob(jobRes?.data || null);
        setShops((shopRes?.data || []) as Shop[]);
      } catch (e: any) {
        Alert.alert("Error", e?.message || "Could not load order details");
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId, token]);

  // Load shop items when a shop is picked
  useEffect(() => {
    if (!selectedShopId || !token) {
      setShopItems([]);
      return;
    }
    (async () => {
      try {
        setLoadingItems(true);
        const url = `${api.hardware.getItems}?shopId=${selectedShopId}`;
        const res = await apiCall(url, "GET", undefined, token);
        setShopItems((res?.data || []) as HardwareItem[]);
      } catch (e: any) {
        Alert.alert("Error", e?.message || "Could not load shop items");
      } finally {
        setLoadingItems(false);
      }
    })();
  }, [selectedShopId, token]);

  const filteredItems = useMemo(() => {
    if (!search.trim()) return shopItems;
    const q = search.toLowerCase();
    return shopItems.filter(
      (it) =>
        it.name.toLowerCase().includes(q) ||
        it.category?.toLowerCase().includes(q),
    );
  }, [shopItems, search]);

  const cartLines = useMemo(() => Object.values(cart), [cart]);
  const cartTotal = useMemo(
    () =>
      cartLines.reduce((sum, l) => sum + (l.price || 0) * (l.quantity || 1), 0),
    [cartLines],
  );

  const addToCart = (item: HardwareItem) => {
    setCart((prev) => {
      const existing = prev[item._id];
      if (existing) {
        return {
          ...prev,
          [item._id]: { ...existing, quantity: existing.quantity + 1 },
        };
      }
      return {
        ...prev,
        [item._id]: {
          hardwareItemId: item._id,
          name: item.name,
          price: item.price,
          quantity: 1,
          image: item.image,
          unit: item.unit,
        },
      };
    });
  };

  const updateQty = (hardwareItemId: string, delta: number) => {
    setCart((prev) => {
      const existing = prev[hardwareItemId];
      if (!existing) return prev;
      const newQty = existing.quantity + delta;
      if (newQty <= 0) {
        const { [hardwareItemId]: _, ...rest } = prev;
        return rest;
      }
      return {
        ...prev,
        [hardwareItemId]: { ...existing, quantity: newQty },
      };
    });
  };

  const handleCheckout = () => {
    if (!selectedShopId || !selectedShop) {
      Alert.alert("Pick a shop", "Please select a hardware shop first.");
      return;
    }
    if (cartLines.length === 0) {
      Alert.alert("Empty cart", "Add at least one item from the shop.");
      return;
    }
    router.push({
      pathname: "/(worker)/hardware-checkout",
      params: {
        jobId,
        customerId,
        shopId: selectedShopId,
        shopName: selectedShop.shopName,
        shopAddress: [selectedShop.address, selectedShop.city]
          .filter(Boolean)
          .join(", "),
        cart: JSON.stringify(cartLines),
      },
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Order Hardware</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Shop picker */}
        <Text style={styles.sectionTitle}>Choose Hardware Shop</Text>
        {shops.length === 0 ? (
          <View style={styles.card}>
            <Text style={styles.emptyText}>No hardware shops available.</Text>
          </View>
        ) : (
          shops.map((shop) => {
            const isSelected = selectedShopId === shop._id;
            return (
              <TouchableOpacity
                key={shop._id}
                onPress={() => {
                  setSelectedShopId(shop._id);
                  setCart({});
                }}
                style={[
                  styles.shopCard,
                  isSelected && styles.shopCardSelected,
                ]}
              >
                <View style={styles.shopIcon}>
                  <Ionicons
                    name="storefront-outline"
                    size={22}
                    color={isSelected ? Colors.primary : Colors.textSecondary}
                  />
                </View>
                <View style={styles.shopInfo}>
                  <Text style={styles.shopName}>{shop.shopName}</Text>
                  {!!(shop.city || shop.address) && (
                    <Text style={styles.shopMeta} numberOfLines={1}>
                      {[shop.address, shop.city].filter(Boolean).join(", ")}
                    </Text>
                  )}
                </View>
                <View
                  style={[styles.radio, isSelected && styles.radioSelected]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {/* Catalog */}
        {selectedShopId && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
              Browse Products
            </Text>
            <View style={styles.searchBar}>
              <Ionicons
                name="search-outline"
                size={18}
                color={Colors.textSecondary}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search items..."
                placeholderTextColor={Colors.textSecondary}
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {loadingItems ? (
              <View style={{ padding: 20, alignItems: "center" }}>
                <ActivityIndicator color={Colors.primary} />
              </View>
            ) : filteredItems.length === 0 ? (
              <View style={styles.card}>
                <Text style={styles.emptyText}>
                  No items in this shop's catalog.
                </Text>
              </View>
            ) : (
              <FlatList
                scrollEnabled={false}
                data={filteredItems}
                keyExtractor={(item) => item._id}
                renderItem={({ item }) => {
                  const inCart = cart[item._id];
                  return (
                    <View style={styles.itemCard}>
                      <View style={styles.itemImageWrap}>
                        {item.image ? (
                          <Image
                            source={{ uri: item.image }}
                            style={styles.itemImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Ionicons
                            name="cube-outline"
                            size={28}
                            color={Colors.textSecondary}
                          />
                        )}
                      </View>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.itemMeta}>
                          {item.category}
                          {item.unit ? ` • ${item.unit}` : ""}
                        </Text>
                        <Text style={styles.itemPrice}>{item.price} LKR</Text>
                      </View>
                      {inCart ? (
                        <View style={styles.qtyControls}>
                          <TouchableOpacity
                            onPress={() => updateQty(item._id, -1)}
                            style={styles.qtyBtn}
                          >
                            <Ionicons name="remove" size={18} color="white" />
                          </TouchableOpacity>
                          <Text style={styles.qtyText}>{inCart.quantity}</Text>
                          <TouchableOpacity
                            onPress={() => updateQty(item._id, 1)}
                            style={styles.qtyBtn}
                          >
                            <Ionicons name="add" size={18} color="white" />
                          </TouchableOpacity>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={styles.addBtn}
                          onPress={() => addToCart(item)}
                        >
                          <Ionicons name="add" size={18} color="white" />
                        </TouchableOpacity>
                      )}
                    </View>
                  );
                }}
              />
            )}
          </>
        )}

        {/* Approved suggestions reference */}
        {approvedSuggestions.length > 0 && (
          <View style={[styles.card, { marginTop: 16 }]}>
            <Text style={styles.sectionTitle}>Customer's Approved List</Text>
            {approvedSuggestions.map((item: any, idx: number) => (
              <Text key={idx} style={styles.approvedItem}>
                • {item.name} ×{item.quantity || 1}
              </Text>
            ))}
            <Text style={styles.approvedHint}>
              Use this as reference when shopping the catalog.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Cart summary footer */}
      {cartLines.length > 0 && (
        <View style={styles.cartSummary}>
          <View style={styles.cartSummaryTop}>
            <Text style={styles.cartSummaryTitle}>
              {cartLines.length} item{cartLines.length > 1 ? "s" : ""} in order
            </Text>
            <Text style={styles.cartSummaryTotal}>{cartTotal} LKR</Text>
          </View>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleCheckout}
          >
            <Text style={styles.submitText}>Checkout</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: { padding: 4, width: 40 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  content: { padding: 16, paddingBottom: 140 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: "center" },
  shopCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  shopCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#F0F4F8",
  },
  shopIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.lightBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  shopInfo: { flex: 1 },
  shopName: { fontSize: 14, fontWeight: "700", color: Colors.text },
  shopMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  radioSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  radioInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
    alignSelf: "center",
    marginTop: 5,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    paddingVertical: 4,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemImageWrap: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.lightBackground,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  itemImage: { width: 56, height: 56 },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: "600", color: Colors.text },
  itemMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  itemPrice: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: "700",
    marginTop: 4,
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  qtyText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
    minWidth: 22,
    textAlign: "center",
  },
  approvedItem: { fontSize: 13, color: Colors.text, paddingVertical: 2 },
  approvedHint: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginTop: 6,
  },
  cartSummary: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cartSummaryTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  cartSummaryTitle: { fontSize: 13, color: Colors.textSecondary },
  cartSummaryTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: { color: "white", fontSize: 15, fontWeight: "700" },
});
