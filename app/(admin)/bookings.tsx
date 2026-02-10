import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";

export default function AdminBookings() {
  const { jobs = [] } = useStore();
  const [filterStatus, setFilterStatus] = useState<
    "all" | "pending" | "confirmed" | "completed" | "cancelled"
  >("all");

  const filteredBookings =
    filterStatus === "all"
      ? jobs
      : jobs.filter((b: any) => b.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#FFA500";
      case "confirmed":
        return Colors.primary;
      case "completed":
        return "#4CAF50";
      case "cancelled":
        return "#FF6B6B";
      default:
        return Colors.textSecondary;
    }
  };

  const handleUpdateStatus = (bookingId: string, newStatus: string) => {
    Alert.alert("Update Status", `Change booking status to ${newStatus}?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () => {
          // Implement status update logic here
          Alert.alert("Success", "Booking status updated");
        },
      },
    ]);
  };

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
        {[
          { key: "all", label: "All", count: jobs.length },
          {
            key: "pending",
            label: "Pending",
            count: jobs.filter((b: any) => b.status === "pending").length,
          },
          {
            key: "confirmed",
            label: "Confirmed",
            count: jobs.filter((b: any) => b.status === "confirmed").length,
          },
          {
            key: "completed",
            label: "Completed",
            count: jobs.filter((b: any) => b.status === "completed").length,
          },
          {
            key: "cancelled",
            label: "Cancelled",
            count: jobs.filter((b: any) => b.status === "cancelled").length,
          },
        ].map((filter) => (
          <TouchableOpacity
            key={filter.key}
            style={[
              styles.filterChip,
              filterStatus === filter.key && styles.activeChip,
            ]}
            onPress={() => setFilterStatus(filter.key as any)}
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
                {filter.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Bookings List */}
      <ScrollView
        style={styles.listContainer}
        showsVerticalScrollIndicator={false}
      >
        {filteredBookings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="calendar-outline"
              size={64}
              color={Colors.textSecondary}
            />
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        ) : (
          filteredBookings.map((booking: any) => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingHeader}>
                <View style={styles.bookingInfo}>
                  <Text style={styles.bookingId}>#{booking.id}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor: getStatusColor(booking.status) + "20",
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: getStatusColor(booking.status) },
                      ]}
                    >
                      {booking.status}
                    </Text>
                  </View>
                </View>
                <Text style={styles.bookingDate}>{booking.date}</Text>
              </View>

              <View style={styles.bookingDetails}>
                <View style={styles.detailRow}>
                  <Ionicons
                    name="person-outline"
                    size={16}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.detailText}>
                    Customer: {booking.customerName || "N/A"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons
                    name="hammer-outline"
                    size={16}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.detailText}>
                    Worker: {booking.workerName}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons
                    name="briefcase-outline"
                    size={16}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.detailText}>
                    Service: {booking.service}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Ionicons
                    name="cash-outline"
                    size={16}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.detailText}>
                    Amount: ${booking.amount || "0.00"}
                  </Text>
                </View>
              </View>

              {booking.status === "pending" && (
                <View style={styles.actions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.confirmButton]}
                    onPress={() => handleUpdateStatus(booking.id, "confirmed")}
                  >
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={Colors.background}
                    />
                    <Text style={styles.actionButtonText}>Confirm</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={() => handleUpdateStatus(booking.id, "cancelled")}
                  >
                    <Ionicons
                      name="close"
                      size={20}
                      color={Colors.background}
                    />
                    <Text style={styles.actionButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))
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
    marginBottom: 20,
  },
  filterContent: {
    gap: 8,
    paddingRight: 20,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  activeChip: {
    backgroundColor: Colors.primary,
  },
  filterLabel: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
  activeLabel: {
    color: Colors.background,
  },
  badge: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: "center",
  },
  activeBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },
  activeBadgeText: {
    color: Colors.background,
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
