import { api, apiCall } from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../../constants/Colors";

interface HardwareItem {
  _id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  inStock: boolean;
}

export default function HardwareShopTab() {
  const [items, setItems] = useState<HardwareItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const loadItems = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiCall(api.hardware.getItems, "GET");
      setItems((response?.data || []) as HardwareItem[]);
    } catch (e: any) {
      setError(e?.message || "Failed to load hardware items");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadItems();
    }, [loadItems]),
  );

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((i) => {
      if (i.category) set.add(i.category);
    });
    return ["All", ...Array.from(set).sort()];
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const matchesSearch = (i.name || "")
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === "All" || i.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, search, activeCategory]);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Ionicons name="cube-outline" size={26} color={Colors.primary} />
          <Text style={styles.heading}>Hardware Shop</Text>
        </View>

        <View style={styles.searchBox}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.textSecondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search items..."
            placeholderTextColor={Colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryCard,
                activeCategory === cat && styles.activeCategory,
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === cat && styles.activeCategoryText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons
              name="cube-outline"
              size={48}
              color={Colors.textSecondary}
            />
            <Text style={styles.emptyText}>No items found</Text>
          </View>
        ) : (
          <View style={styles.itemGrid}>
            {filteredItems.map((item) => (
              <View key={item._id} style={styles.itemCard}>
                <View style={styles.itemIconWrap}>
                  <Ionicons
                    name="cube"
                    size={28}
                    color={Colors.primary}
                  />
                </View>
                <Text style={styles.itemName} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.itemCategory}>{item.category}</Text>
                <View style={styles.itemFooter}>
                  <Text style={styles.itemPrice}>{item.price} LKR</Text>
                  <Text style={styles.itemUnit}>/ {item.unit}</Text>
                </View>
                <View
                  style={[
                    styles.stockBadge,
                    {
                      backgroundColor: item.inStock ? "#E8F5E9" : "#FFEBEE",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stockText,
                      { color: item.inStock ? "#2E7D32" : "#C62828" },
                    ]}
                  >
                    {item.inStock ? "In stock" : "Out of stock"}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 20, paddingBottom: 100 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  heading: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular" },
  categoriesScroll: { marginBottom: 20, flexDirection: "row" },
  categoryCard: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  activeCategory: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
    fontSize: 13,
  },
  activeCategoryText: { color: Colors.white },
  loadingWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  errorText: {
    color: "#C62828",
    textAlign: "center",
    marginTop: 30,
  },
  emptyWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: { color: Colors.textSecondary, fontSize: 14 },
  itemGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  itemCard: {
    width: "48%",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f2f5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  itemName: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 2,
  },
  itemCategory: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  itemFooter: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  itemUnit: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  stockBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 8,
  },
  stockText: {
    fontSize: 10,
    fontWeight: "700",
  },
});
