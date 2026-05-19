import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { api, apiCall } from "../../constants/api";
import { useStore } from "../../constants/Store";

type HardwareShop = {
  _id: string;
  shopName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  licenseNumber: string;
  image?: string;
  verified: boolean;
  isActive: boolean;
  createdAt?: string;
};

export default function AdminHardwareShops() {
  const { token } = useStore();
  const [shops, setShops] = useState<HardwareShop[]>([]);
  const [search, setSearch] = useState("");
  const [selectedShop, setSelectedShop] = useState<HardwareShop | null>(null);

  const loadShops = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiCall(
        api.admin.listHardwareShops,
        "GET",
        undefined,
        token,
      );
      setShops(res?.data || []);
    } catch {
      // silent
    }
  }, [token]);

  useEffect(() => {
    loadShops();
  }, [loadShops]);

  const filteredShops = useMemo(() => {
    const q = search.toLowerCase();
    return shops.filter(
      (s) =>
        s.shopName.toLowerCase().includes(q) ||
        (s.city || "").toLowerCase().includes(q) ||
        (s.email || "").toLowerCase().includes(q),
    );
  }, [shops, search]);

  const handleDeleteShop = (shop: HardwareShop) => {
    Alert.alert(
      "Delete Hardware Shop",
      `Permanently delete ${shop.shopName}? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiCall(
                api.admin.deleteHardwareShop(shop._id),
                "DELETE",
                undefined,
                token,
              );
              await loadShops();
              setSelectedShop(null);
              Alert.alert("Deleted", `${shop.shopName} has been removed.`);
            } catch (err: any) {
              Alert.alert(
                "Error",
                err?.message || "Failed to delete hardware shop",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Hardware Shops</Text>
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
          placeholder="Search shops..."
          placeholderTextColor={Colors.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {filteredShops.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="storefront-outline"
              size={48}
              color={Colors.textSecondary}
            />
            <Text style={styles.emptyText}>No hardware shops found</Text>
          </View>
        ) : (
          filteredShops.map((shop) => (
            <TouchableOpacity
              key={shop._id}
              style={styles.shopCard}
              activeOpacity={0.7}
              onPress={() => setSelectedShop(shop)}
            >
              <View style={styles.shopInfo}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {(shop.shopName || "?").charAt(0)}
                  </Text>
                </View>
                <View style={styles.shopDetails}>
                  <Text style={styles.shopName}>{shop.shopName}</Text>
                  <Text style={styles.shopSubtitle}>
                    {shop.city || shop.email || "Hardware Shop"}
                  </Text>
                  <View style={styles.shopStats}>
                    <Ionicons
                      name={
                        shop.verified
                          ? "shield-checkmark"
                          : "shield-outline"
                      }
                      size={14}
                      color={shop.verified ? "#4CAF50" : Colors.textSecondary}
                    />
                    <Text style={styles.shopMeta}>
                      {shop.verified ? "Verified" : "Unverified"}
                    </Text>
                    <Text style={styles.shopDivider}>•</Text>
                    <Text style={styles.shopMeta}>
                      {shop.isActive ? "Active" : "Inactive"}
                    </Text>
                  </View>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => handleDeleteShop(shop)}
              >
                <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      <Modal
        visible={!!selectedShop}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedShop(null)}
      >
        <View style={styles.detailOverlay}>
          <View style={styles.detailSheet}>
            <View style={styles.detailHeader}>
              <Text style={styles.detailTitle}>Hardware Shop Details</Text>
              <TouchableOpacity onPress={() => setSelectedShop(null)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            {selectedShop && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.detailAvatar}>
                  <Text style={styles.detailAvatarText}>
                    {(selectedShop.shopName || "?").charAt(0)}
                  </Text>
                </View>
                <Text style={styles.detailName}>{selectedShop.shopName}</Text>
                <Text style={styles.detailRole}>
                  {selectedShop.city || "Hardware Shop"}
                </Text>
                <View style={{ height: 12 }} />

                {[
                  {
                    icon: "mail-outline",
                    label: "Email",
                    value: selectedShop.email || "—",
                  },
                  {
                    icon: "call-outline",
                    label: "Phone",
                    value: selectedShop.phone || "—",
                  },
                  {
                    icon: "location-outline",
                    label: "Address",
                    value: selectedShop.address || "—",
                  },
                  {
                    icon: "business-outline",
                    label: "City",
                    value: selectedShop.city || "—",
                  },
                  {
                    icon: "document-text-outline",
                    label: "License Number",
                    value: selectedShop.licenseNumber || "—",
                  },
                  {
                    icon: "shield-checkmark-outline",
                    label: "Verified",
                    value: selectedShop.verified ? "Yes" : "No",
                  },
                  {
                    icon: "power-outline",
                    label: "Status",
                    value: selectedShop.isActive ? "Active" : "Inactive",
                  },
                ].map((r) => (
                  <View key={r.label} style={styles.detailRow}>
                    <Ionicons
                      name={r.icon as any}
                      size={18}
                      color={Colors.primary}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.detailLabel}>{r.label}</Text>
                      <Text style={styles.detailValue}>{r.value}</Text>
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleDeleteShop(selectedShop)}
                >
                  <Ionicons name="trash-outline" size={18} color="#fff" />
                  <Text style={styles.removeBtnText}>Remove Shop</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
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
  listContainer: {
    flex: 1,
  },
  shopCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  shopInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.background,
  },
  shopDetails: {
    flex: 1,
  },
  shopName: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  shopSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  shopStats: {
    flexDirection: "row",
    alignItems: "center",
  },
  shopMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginLeft: 4,
  },
  shopDivider: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginHorizontal: 6,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "#FF6B6B" + "20",
  },
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 12,
  },
  detailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  detailSheet: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 420,
    maxHeight: "85%",
  },
  detailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  detailAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: 10,
  },
  detailAvatarText: {
    fontSize: 26,
    fontWeight: "bold",
    color: Colors.background,
  },
  detailName: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  detailRole: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 2,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
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
    fontWeight: "500",
    marginTop: 2,
  },
  removeBtn: {
    marginTop: 20,
    backgroundColor: "#FF6B6B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  removeBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});
