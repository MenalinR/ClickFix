import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
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

export default function OrderHardwarePage() {
  const router = useRouter();
  const { token } = useStore();
  const params = useLocalSearchParams<{ jobId?: string }>();
  const jobId = typeof params.jobId === "string" ? params.jobId : "";

  const [job, setJob] = useState<any>(null);
  const [shops, setShops] = useState<Shop[]>([]);
  const [selectedShopId, setSelectedShopId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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

  const approvedItems = useMemo(
    () =>
      (job?.hardwareItems || []).filter((it: any) => it.status === "approved"),
    [job],
  );
  const totalCost = useMemo(
    () =>
      approvedItems.reduce(
        (sum: number, it: any) =>
          sum + (Number(it.price) || 0) * (Number(it.quantity) || 1),
        0,
      ),
    [approvedItems],
  );

  const handleSubmit = async () => {
    if (!selectedShopId) {
      Alert.alert("Pick a shop", "Please select a hardware shop first.");
      return;
    }
    if (approvedItems.length === 0) {
      Alert.alert(
        "No items",
        "There are no approved hardware items to order on this job.",
      );
      return;
    }
    setSubmitting(true);
    try {
      await apiCall(
        api.hardware.createOrderFromJob,
        "POST",
        { jobId, shopId: selectedShopId },
        token,
      );
      Alert.alert("Order sent", "The hardware shop has been notified.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
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

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Approved Items</Text>
          {approvedItems.length === 0 ? (
            <Text style={styles.emptyText}>
              No approved hardware items on this job.
            </Text>
          ) : (
            <>
              {approvedItems.map((it: any, idx: number) => (
                <View key={idx} style={styles.itemRow}>
                  <Text style={styles.itemName} numberOfLines={1}>
                    {it.name}
                  </Text>
                  <Text style={styles.itemQty}>×{it.quantity || 1}</Text>
                  <Text style={styles.itemPrice}>
                    {(it.price || 0) * (it.quantity || 1)} LKR
                  </Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{totalCost} LKR</Text>
              </View>
            </>
          )}
        </View>

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
                onPress={() => setSelectedShopId(shop._id)}
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
                  {!!shop.phone && (
                    <Text style={styles.shopMeta}>{shop.phone}</Text>
                  )}
                </View>
                <View
                  style={[
                    styles.radio,
                    isSelected && styles.radioSelected,
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedShopId ||
              approvedItems.length === 0 ||
              submitting) && { opacity: 0.5 },
          ]}
          onPress={handleSubmit}
          disabled={
            !selectedShopId || approvedItems.length === 0 || submitting
          }
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitText}>Send Order to Shop</Text>
          )}
        </TouchableOpacity>
      </View>
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
  content: { padding: 16, paddingBottom: 100 },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  emptyText: { fontSize: 13, color: Colors.textSecondary, textAlign: "center" },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    gap: 8,
  },
  itemName: { flex: 1, fontSize: 13, color: Colors.text },
  itemQty: { fontSize: 12, color: Colors.textSecondary, width: 30 },
  itemPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    minWidth: 80,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLabel: { fontSize: 14, fontWeight: "700", color: Colors.text },
  totalValue: { fontSize: 16, fontWeight: "700", color: Colors.primary },
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
  footer: {
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
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: { color: "white", fontSize: 15, fontWeight: "700" },
});
