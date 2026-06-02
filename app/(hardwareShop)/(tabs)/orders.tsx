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
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type OrderStatus =
  | "pending"
  | "approved"
  | "packing"
  | "ready"
  | "coming"
  | "picked_up"
  | "rejected"
  | "delivered";

interface Order {
  _id: string;
  status: OrderStatus;
  totalCost: number;
  items: Array<{ name: string; quantity: number; price: number }>;
  workerId: { name: string; phone: string };
  customerId: { name: string; phone: string };
  createdAt: string;
}

export default function OrdersScreen() {
  const { token } = useStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const statuses = ["pending", "approved", "packing", "ready", "coming", "delivered"];

  const fetchOrders = async () => {
    try {
      if (!token) return;
      const params = selectedStatus ? `?status=${selectedStatus}` : "";
      const url =
        api.hardwareShop.getOrders +
        (params.startsWith("?") ? params : "");
      const response = await apiCall(url, "GET", undefined, token);
      if (response.success) {
        setOrders(response.data);
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchOrders();
    }, [token, selectedStatus])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  }, [token, selectedStatus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#FF9800";
      case "approved":
        return "#4CAF50";
      case "packing":
        return "#8E24AA";
      case "ready":
        return "#0288D1";
      case "coming":
        return "#00897B";
      case "picked_up":
      case "delivered":
        return "#2196F3";
      case "rejected":
        return "#C62828";
      default:
        return "#999";
    }
  };

  const prettyStatus = (status: string) =>
    status === "picked_up"
      ? "Picked Up"
      : status === "coming"
        ? "On the Way"
        : status.charAt(0).toUpperCase() + status.slice(1);

  const runAction = async (
    orderId: string,
    url: string,
    body?: any,
    successMessage?: string,
  ) => {
    if (!token) return;
    try {
      setBusyOrderId(orderId);
      const res = await apiCall(url, "PUT", body, token);
      if (!res.success) {
        Alert.alert("Error", res.message || "Failed to update order");
        return;
      }
      if (successMessage) Alert.alert("Done", successMessage);
      await fetchOrders();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update order");
    } finally {
      setBusyOrderId(null);
    }
  };

  const handleAccept = (orderId: string) =>
    runAction(
      orderId,
      api.hardwareShop.acceptOrder(orderId),
      undefined,
      "Order accepted. The worker has been notified.",
    );

  const handleMarkPacking = (orderId: string) =>
    runAction(
      orderId,
      api.hardwareShop.markPacking(orderId),
      undefined,
      "Marked as packing. The worker has been notified.",
    );

  const handleMarkReady = (orderId: string) =>
    runAction(
      orderId,
      api.hardwareShop.markReady(orderId),
      undefined,
      "Marked ready for pickup. The worker has been notified.",
    );

  const handleComplete = (orderId: string) =>
    runAction(
      orderId,
      api.hardwareShop.completeOrder(orderId),
      undefined,
      "Order completed. The worker has been notified.",
    );

  const submitReject = async () => {
    if (!rejectFor) return;
    const reason = rejectReason.trim();
    if (!reason) {
      Alert.alert("Reason required", "Please tell the worker why.");
      return;
    }
    await runAction(
      rejectFor,
      api.hardwareShop.rejectOrder(rejectFor),
      { reason },
      "Order rejected. The worker has been notified.",
    );
    setRejectFor(null);
    setRejectReason("");
  };

  const renderActions = (item: Order) => {
    const isBusy = busyOrderId === item._id;
    if (item.status === "pending") {
      return (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.rejectBtn]}
            disabled={isBusy}
            onPress={() => {
              setRejectReason("");
              setRejectFor(item._id);
            }}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color="#C62828" />
            ) : (
              <>
                <Ionicons name="close-circle-outline" size={16} color="#C62828" />
                <Text style={styles.rejectBtnText}>Reject</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.acceptBtn]}
            disabled={isBusy}
            onPress={() => handleAccept(item._id)}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                <Text style={styles.acceptBtnText}>Accept</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }
    if (item.status === "approved") {
      return (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.packingBtn]}
            disabled={isBusy}
            onPress={() => handleMarkPacking(item._id)}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="cube-outline" size={16} color="white" />
                <Text style={styles.acceptBtnText}>Mark Packing</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }
    if (item.status === "packing") {
      return (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.readyBtn]}
            disabled={isBusy}
            onPress={() => handleMarkReady(item._id)}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-done-outline" size={16} color="white" />
                <Text style={styles.acceptBtnText}>Mark Ready for Pickup</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }
    if (item.status === "coming") {
      return (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.completeBtn]}
            disabled={isBusy}
            onPress={() => handleComplete(item._id)}
          >
            {isBusy ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={16} color="white" />
                <Text style={styles.acceptBtnText}>Mark Completed</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  const renderOrder = ({ item }: { item: Order }) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderTitle}>Order #{item._id.slice(-6)}</Text>
          <Text style={styles.orderDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) },
          ]}
        >
          <Text style={styles.statusText}>{prettyStatus(item.status)}</Text>
        </View>
      </View>

      <View style={styles.orderDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="person" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>
            Worker: {item.workerId?.name || "N/A"}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="home" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>
            Customer: {item.customerId?.name || "N/A"}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="pricetag" size={16} color={Colors.textSecondary} />
          <Text style={styles.detailText}>
            Total: {item.totalCost.toFixed(2)} LKR
          </Text>
        </View>
      </View>

      <View style={styles.itemsList}>
        <Text style={styles.itemsLabel}>Items ({item.items.length})</Text>
        {item.items.map((itemData, idx) => (
          <Text key={idx} style={styles.itemText}>
            • {itemData.name} x{itemData.quantity}
          </Text>
        ))}
      </View>

      {renderActions(item)}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.title}>Orders</Text>
      </View>

      {/* Status Filter */}
      <View style={styles.filterRow}>
        <Pressable
          style={[
            styles.filterButton,
            !selectedStatus && styles.filterButtonActive,
          ]}
          onPress={() => setSelectedStatus(null)}
        >
          <Text
            style={[
              styles.filterText,
              !selectedStatus && styles.filterTextActive,
            ]}
          >
            All
          </Text>
        </Pressable>
        {statuses.map((status) => (
          <Pressable
            key={status}
            style={[
              styles.filterButton,
              selectedStatus === status && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedStatus(status)}
          >
            <Text
              style={[
                styles.filterText,
                selectedStatus === status && styles.filterTextActive,
              ]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      <Modal
        visible={!!rejectFor}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectFor(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Reject order</Text>
            <Text style={styles.modalSubtitle}>
              Tell the worker why you can&apos;t fulfill this order.
            </Text>
            <TextInput
              value={rejectReason}
              onChangeText={setRejectReason}
              placeholder="e.g. Out of stock"
              placeholderTextColor={Colors.textSecondary}
              style={styles.modalInput}
              multiline
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setRejectFor(null)}
                disabled={busyOrderId === rejectFor}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalReject]}
                onPress={submitReject}
                disabled={busyOrderId === rejectFor}
              >
                {busyOrderId === rejectFor ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalRejectText}>Reject order</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>No orders found</Text>
          <Text style={styles.emptySubtext}>
            Orders will appear here when workers request your hardware items.
          </Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item._id}
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
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
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
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: Colors.background,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  filterTextActive: {
    color: "white",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  listContent: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  orderDate: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "white",
  },
  orderDetails: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
    marginBottom: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  itemsList: {
    backgroundColor: Colors.background,
    borderRadius: 6,
    padding: 12,
  },
  itemsLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: 8,
  },
  itemText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginBottom: 4,
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
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  rejectBtn: {
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: "#EF9A9A",
  },
  rejectBtnText: { color: "#C62828", fontWeight: "600", fontSize: 13 },
  acceptBtn: { backgroundColor: "#2E7D32" },
  acceptBtnText: { color: "white", fontWeight: "600", fontSize: 13 },
  packingBtn: { backgroundColor: "#8E24AA" },
  readyBtn: { backgroundColor: "#0288D1" },
  completeBtn: { backgroundColor: "#00897B" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    minHeight: 80,
    color: Colors.text,
    fontSize: 14,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancel: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: { color: Colors.text, fontWeight: "600" },
  modalReject: { backgroundColor: "#C62828" },
  modalRejectText: { color: "white", fontWeight: "600" },
});
