import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../../constants/Colors";
import { useStore } from "../../../constants/Store";

type BookingFilter = "All" | "Pending" | "Completed" | "Cancelled";

export default function BookingsScreen() {
  const router = useRouter();
  const { jobs, fetchJobs, token } = useStore();
  const [selectedFilter, setSelectedFilter] = useState<BookingFilter>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      setLoading(true);
      fetchJobs().finally(() => setLoading(false));
    }
  }, [token]);

  const bookings = useMemo(() => (Array.isArray(jobs) ? jobs : []), [jobs]);

  const filteredBookings = useMemo(() => {
    if (selectedFilter === "All") return bookings;
    const status = selectedFilter.toLowerCase();
    return bookings.filter((j) => (j.status || "").toLowerCase() === status);
  }, [bookings, selectedFilter]);

  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "completed") return { background: "#E8F5E9", text: "#2E7D32" };
    if (s === "cancelled" || s === "rejected") return { background: "#FFEBEE", text: "#C62828" };
    if (s === "pending" || s === "accepted" || s === "on the way" || s === "in progress")
      return { background: "#FFF3E0", text: "#E65100" };
    return { background: Colors.lightBackground, text: Colors.primary };
  };

  const formatDate = (d: string | Date) => {
    if (!d) return "—";
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const workerName = (job: any) =>
    job?.workerId?.name || job?.requestedWorkerId?.name || "—";
  const workerImage = (job: any) =>
    job?.workerId?.image || job?.requestedWorkerId?.image || "https://via.placeholder.com/40";
  const amount = (job: any) =>
    job?.pricing?.totalAmount ?? job?.pricing?.serviceCharge ?? 0;

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
          <Text style={styles.heading}>Booking History</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(["All", "Pending", "Completed", "Cancelled"] as BookingFilter[]).map(
            (filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setSelectedFilter(filter)}
                style={[
                  styles.filterTab,
                  selectedFilter === filter && styles.filterTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === filter && styles.filterTabTextActive,
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ),
          )}
        </View>

        {/* Summary Stats */}
        {selectedFilter === "All" && !loading && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Bookings</Text>
              <Text style={styles.statValue}>{bookings.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={styles.statValue}>
                {bookings.reduce((sum, b) => sum + amount(b), 0)} LKR
              </Text>
            </View>
          </View>
        )}

        {/* Bookings Table */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : filteredBookings.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.horizontalScroll}>
            <View style={styles.tableWrap}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableHeaderText, styles.colDate]}>Date</Text>
                <Text style={[styles.tableHeaderText, styles.colWorker]}>Worker</Text>
                <Text style={[styles.tableHeaderText, styles.colService]}>Service</Text>
                <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
                <Text style={[styles.tableHeaderText, styles.colStatus]}>Status</Text>
              </View>
              {filteredBookings.map((job) => {
                const id = job._id || job.id;
                const status = (job.status || "Pending") as string;
                const colors = getStatusColor(status);
                return (
                  <View key={id} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.colDate]}>
                      {formatDate(job.scheduledDate || job.createdAt)}
                    </Text>
                    <View style={[styles.colWorker, styles.cellWorker]}>
                      <Image
                        source={{ uri: workerImage(job) }}
                        style={styles.tableWorkerImage}
                      />
                      <Text style={styles.tableCell}>
                        {workerName(job)}
                      </Text>
                    </View>
                    <Text style={[styles.tableCell, styles.colService]}>
                      {job.serviceType || "—"}
                    </Text>
                    <Text style={[styles.tableCell, styles.colAmount]}>
                      {amount(job)} LKR
                    </Text>
                    <View style={[styles.colStatus, styles.statusBadge, { backgroundColor: colors.background }]}>
                      <Text style={[styles.statusText, { color: colors.text }]}>
                        {status}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyStateText}>No bookings yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Your {selectedFilter.toLowerCase()} bookings will appear here
            </Text>
            <TouchableOpacity style={styles.browseButton}>
              <Text style={styles.browseButtonText}>Browse Services</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
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
  filterContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 20,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "white",
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: "600",
  },
  filterTabTextActive: {
    color: "white",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.primary,
  },
  bookingCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  workerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  bookingInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 2,
  },
  serviceType: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  date: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  amount: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ratingDisplay: {
    flex: 1,
  },
  starsRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  rateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: Colors.lightBackground,
  },
  rateButtonText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },
  chatButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: Colors.lightBackground,
  },
  detailsButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: "center",
  },
  horizontalScroll: {
    marginHorizontal: -16,
  },
  tableWrap: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: "hidden",
    minWidth: "100%",
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: Colors.lightBackground,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.textSecondary,
  },
  colDate: { width: 100, justifyContent: "center" },
  colWorker: { width: 140, justifyContent: "center" },
  colService: { width: 110, justifyContent: "center" },
  colAmount: { width: 100, justifyContent: "center" },
  colStatus: { width: 100, justifyContent: "center", alignItems: "center" },
  tableRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tableCell: {
    fontSize: 12,
    color: Colors.text,
    lineHeight: 18,
    flexWrap: "wrap",
  },
  cellWorker: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  tableWorkerImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    flexShrink: 0,
  },
});
