import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";

type FilterKey =
  | "all"
  | "pending"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

const STATUS_GROUPS: Record<Exclude<FilterKey, "all">, string[]> = {
  pending: ["Pending", "Worker Accepted", "Negotiating"],
  confirmed: ["Accepted", "On the way"],
  in_progress: ["In progress"],
  completed: ["Completed"],
  cancelled: ["Cancelled", "Rejected", "Denied"],
};

const matchesFilter = (status: string, key: FilterKey) => {
  if (key === "all") return true;
  return STATUS_GROUPS[key].includes(status);
};

export default function AdminBookings() {
  const { jobs = [], fetchJobs, token } = useStore();
  const [filterStatus, setFilterStatus] = useState<FilterKey>("all");
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      fetchJobs().finally(() => setLoading(false));
    }, [token, fetchJobs]),
  );

  const list = useMemo(() => (Array.isArray(jobs) ? jobs : []), [jobs]);

  const filteredBookings = useMemo(
    () => list.filter((b: any) => matchesFilter(b.status, filterStatus)),
    [list, filterStatus],
  );

  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "pending") return "#FFA500";
    if (s === "worker accepted") return "#F57F17";
    if (s === "negotiating") return "#1565C0";
    if (s === "accepted" || s === "on the way") return Colors.primary;
    if (s === "in progress") return "#2196F3";
    if (s === "completed") return "#4CAF50";
    if (s === "cancelled" || s === "rejected" || s === "denied")
      return "#FF6B6B";
    return Colors.textSecondary;
  };

  const formatDate = (d: string | Date | undefined) => {
    if (!d) return "—";
    const date = typeof d === "string" ? new Date(d) : d;
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const priceOf = (b: any) => {
    const status = (b?.status || "").toLowerCase();
    if (status === "pending") return 0;
    const isFinalized =
      status !== "worker accepted" && status !== "negotiating";
    if (isFinalized) {
      return (
        b?.pricing?.totalAmount ||
        b?.pricing?.serviceCharge ||
        0
      );
    }
    return (
      b?.pricing?.negotiatedPrice ||
      b?.pricing?.proposedPrice ||
      0
    );
  };

  const shortId = (id: string) =>
    id ? id.slice(-6).toUpperCase() : "—";

  const countFor = (key: FilterKey) =>
    list.filter((b: any) => matchesFilter(b.status, key)).length;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Bookings Management</Text>

      {/* Status Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        {(
          [
            { key: "all", label: "All" },
            { key: "pending", label: "Pending" },
            { key: "confirmed", label: "Confirmed" },
            { key: "in_progress", label: "In Progress" },
            { key: "completed", label: "Completed" },
            { key: "cancelled", label: "Cancelled" },
          ] as { key: FilterKey; label: string }[]
        ).map((filter) => {
          const count =
            filter.key === "all" ? list.length : countFor(filter.key);
          return (
            <TouchableOpacity
              key={filter.key}
              style={[
                styles.filterChip,
                filterStatus === filter.key && styles.activeChip,
              ]}
              onPress={() => setFilterStatus(filter.key)}
            >
              <Text
                style={[
                  styles.filterLabel,
                  filterStatus === filter.key && styles.activeLabel,
                ]}
              >
                {filter.label}
              </Text>
              <View
                style={[
                  styles.badge,
                  filterStatus === filter.key && styles.activeBadge,
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    filterStatus === filter.key && styles.activeBadgeText,
                  ]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bookings List */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {loading && list.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : filteredBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="calendar-outline"
              size={64}
              color={Colors.textSecondary}
            />
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        ) : (
          filteredBookings.map((booking: any) => {
            const id = booking._id || booking.id;
            const customerName =
              booking.customerId?.name ||
              booking.customer?.name ||
              "N/A";
            const workerName =
              booking.workerId?.name ||
              booking.requestedWorkerId?.name ||
              booking.worker?.name ||
              "Unassigned";
            const service =
              booking.serviceType || booking.service || "—";
            const amount = priceOf(booking);
            const dateStr = formatDate(
              booking.scheduledDate || booking.createdAt,
            );
            return (
              <View key={id} style={styles.bookingCard}>
                <View style={styles.bookingHeader}>
                  <View style={styles.bookingInfo}>
                    <Text style={styles.bookingId}>#{shortId(id)}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            getStatusColor(booking.status) + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(booking.status) },
                        ]}
                      >
                        {booking.status || "—"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.bookingDate}>{dateStr}</Text>
                </View>

                <View style={styles.bookingDetails}>
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="person-outline"
                      size={16}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.detailText}>
                      Customer: {customerName}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="hammer-outline"
                      size={16}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.detailText}>
                      Worker: {workerName}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="briefcase-outline"
                      size={16}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.detailText}>Service: {service}</Text>
                  </View>
                  {!!booking.description && (
                    <View style={styles.detailRow}>
                      <Ionicons
                        name="document-text-outline"
                        size={16}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.detailText} numberOfLines={2}>
                        {booking.description}
                      </Text>
                    </View>
                  )}
                  {!!booking.location?.address && (
                    <View style={styles.detailRow}>
                      <Ionicons
                        name="location-outline"
                        size={16}
                        color={Colors.textSecondary}
                      />
                      <Text style={styles.detailText} numberOfLines={2}>
                        {booking.location.address}
                      </Text>
                    </View>
                  )}
                  <View style={styles.detailRow}>
                    <Ionicons
                      name="cash-outline"
                      size={16}
                      color={Colors.textSecondary}
                    />
                    <Text style={styles.detailText}>
                      Amount: {amount || 0} LKR
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 20,
    marginTop: 10,
  },
  filterContainer: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 16,
  },
  filterContent: {
    gap: 8,
    paddingRight: 20,
    alignItems: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 999,
    paddingHorizontal: 14,
    height: 36,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeChip: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterLabel: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "600",
  },
  activeLabel: {
    color: "#fff",
  },
  badge: {
    backgroundColor: Colors.background,
    borderRadius: 999,
    paddingHorizontal: 7,
    minWidth: 22,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  activeBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text,
  },
  activeBadgeText: {
    color: "#fff",
  },
  listContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginTop: 16,
  },
  bookingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  bookingHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  bookingInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bookingId: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  bookingDate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  bookingDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: Colors.text,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  confirmButton: {
    backgroundColor: "#4CAF50",
  },
  cancelButton: {
    backgroundColor: "#FF6B6B",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.background,
  },
});
