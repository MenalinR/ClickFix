import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, apiCall } from "../../constants/api";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";

type OrderStatus =
  | "pending"
  | "approved"
  | "packing"
  | "ready"
  | "picked_up"
  | "rejected"
  | "delivered";

interface HardwareRequest {
  _id: string;
  status: OrderStatus;
  totalCost: number;
  items: Array<{ name: string; quantity: number; price?: number }>;
  shopId?: {
    _id?: string;
    shopName?: string;
    phone?: string;
    address?: string;
    city?: string;
  };
  jobId?: { _id?: string; serviceType?: string };
  customerNote?: string;
  createdAt: string;
  updatedAt?: string;
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  approved: "Accepted",
  packing: "Packing",
  ready: "Ready for Pickup",
  picked_up: "Picked Up",
  rejected: "Rejected",
  delivered: "Delivered",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
  pending: "#FF9800",
  approved: "#2E7D32",
  packing: "#8E24AA",
  ready: "#0288D1",
  picked_up: "#1565C0",
  rejected: "#C62828",
  delivered: "#1565C0",
};

const STATUS_HINT: Record<OrderStatus, string> = {
  pending: "Waiting for shop to accept your order.",
  approved: "Shop accepted. They'll start packing soon.",
  packing: "Shop is packing your order.",
  ready: "Your order is ready — collect it from the shop.",
  picked_up: "You collected this order.",
  rejected: "Shop rejected this order.",
  delivered: "Order delivered.",
};

export default function HardwareUpdatesScreen() {
  const { token } = useStore();
  const [orders, setOrders] = useState<HardwareRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiCall(
        api.hardware.getRequests,
        "GET",
        undefined,
        token,
      );
      if (res.success) setOrders(res.data || []);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders();
    }, [fetchOrders]),
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  const renderItem = ({ item }: { item: HardwareRequest }) => {
    const status = item.status;
    const color = STATUS_COLOR[status] || Colors.textSecondary;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.shopName} numberOfLines={1}>
              {item.shopId?.shopName || "Hardware shop"}
            </Text>
            <Text style={styles.orderId}>
              Order #{item._id.slice(-6).toUpperCase()}
            </Text>
          </View>
          <View
            style={[styles.statusBadge, { backgroundColor: color + "20" }]}
          >
            <Text style={[styles.statusText, { color }]}>
              {STATUS_LABEL[status] || status}
            </Text>
          </View>
        </View>

        <Text style={styles.statusHint}>{STATUS_HINT[status] || ""}</Text>

        {status === "rejected" && !!item.customerNote && (
          <View style={styles.reasonBox}>
            <Ionicons name="information-circle" size={14} color="#C62828" />
            <Text style={styles.reasonText} numberOfLines={3}>
              {item.customerNote}
            </Text>
          </View>
        )}

        {!!item.shopId?.address && status !== "rejected" && (
          <View style={styles.shopRow}>
            <Ionicons
              name="location-outline"
              size={14}
              color={Colors.textSecondary}
            />
            <Text style={styles.shopMeta} numberOfLines={2}>
              {item.shopId.address}
              {item.shopId.city ? `, ${item.shopId.city}` : ""}
            </Text>
          </View>
        )}

        {!!item.shopId?.phone && status !== "rejected" && (
          <View style={styles.shopRow}>
            <Ionicons
              name="call-outline"
              size={14}
              color={Colors.textSecondary}
            />
            <Text style={styles.shopMeta}>{item.shopId.phone}</Text>
          </View>
        )}

        <View style={styles.itemsBox}>
          <Text style={styles.itemsLabel}>Items ({item.items.length})</Text>
          {item.items.map((it, idx) => (
            <Text key={idx} style={styles.itemText}>
              • {it.name} ×{it.quantity}
            </Text>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={styles.totalText}>
            Total: {item.totalCost.toFixed(2)} LKR
          </Text>
          <Text style={styles.dateText}>
            {new Date(item.updatedAt || item.createdAt).toLocaleString("en-GB", {
              day: "2-digit",
              month: "short",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.headerWrap}>
        <Text style={styles.heading}>Hardware</Text>
        <Text style={styles.subheading}>Order updates from shops</Text>
      </View>

      {loading && orders.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="cube-outline" size={56} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No hardware orders yet</Text>
          <Text style={styles.emptySub}>
            When you place hardware orders for a job, you&apos;ll see their
            status here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerWrap: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heading: { fontSize: 24, fontWeight: "700", color: Colors.text },
  subheading: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
  },
  listContent: { padding: 16, gap: 12 },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
    gap: 10,
  },
  shopName: { fontSize: 15, fontWeight: "700", color: Colors.text },
  orderId: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    letterSpacing: 0.4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  statusHint: { fontSize: 13, color: Colors.text, marginBottom: 8 },
  reasonBox: {
    flexDirection: "row",
    gap: 6,
    backgroundColor: "#FFEBEE",
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    alignItems: "flex-start",
  },
  reasonText: { flex: 1, fontSize: 12, color: "#C62828" },
  shopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  shopMeta: { flex: 1, fontSize: 12, color: Colors.textSecondary },
  itemsBox: {
    marginTop: 10,
    backgroundColor: Colors.background,
    borderRadius: 8,
    padding: 10,
  },
  itemsLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  itemText: { fontSize: 12, color: Colors.text, marginBottom: 2 },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 10,
  },
  totalText: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  dateText: { fontSize: 11, color: Colors.textSecondary },
});
