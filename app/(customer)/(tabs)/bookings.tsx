import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    FlatList,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../../constants/Colors";

type BookingFilter = "All" | "Completed" | "Cancelled";

interface Booking {
  id: string;
  workerName: string;
  workerImage: string;
  serviceType: string;
  amount: number;
  date: string;
  status: "Completed" | "Cancelled" | "Pending";
  rating: number;
  isRated: boolean;
}

export default function BookingsScreen() {
  const router = useRouter();
  const [selectedFilter, setSelectedFilter] = useState<BookingFilter>("All");

  const bookings: Booking[] = [
    {
      id: "1",
      workerName: "Ravi Kumar",
      workerImage: "https://via.placeholder.com/40",
      serviceType: "Plumbing",
      amount: 3500,
      date: "2024-01-15",
      status: "Completed",
      rating: 5,
      isRated: true,
    },
    {
      id: "2",
      workerName: "Priya Sharma",
      workerImage: "https://via.placeholder.com/40",
      serviceType: "Electrical",
      amount: 2500,
      date: "2024-01-08",
      status: "Completed",
      rating: 4,
      isRated: true,
    },
    {
      id: "3",
      workerName: "Arun Singh",
      workerImage: "https://via.placeholder.com/40",
      serviceType: "Carpentry",
      amount: 4200,
      date: "2024-01-01",
      status: "Completed",
      rating: 0,
      isRated: false,
    },
    {
      id: "4",
      workerName: "Vijay Nair",
      workerImage: "https://via.placeholder.com/40",
      serviceType: "AC Repair",
      amount: 2000,
      date: "2023-12-25",
      status: "Cancelled",
      rating: 0,
      isRated: false,
    },
  ];

  const filteredBookings = bookings.filter((booking) => {
    if (selectedFilter === "All") return true;
    return booking.status === selectedFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return { background: "#E8F5E9", text: "#2E7D32" };
      case "Cancelled":
        return { background: "#FFEBEE", text: "#C62828" };
      case "Pending":
        return { background: "#FFF3E0", text: "#E65100" };
      default:
        return { background: Colors.lightBackground, text: Colors.primary };
    }
  };

  const renderBookingCard = ({ item }: { item: Booking }) => (
    <TouchableOpacity style={styles.bookingCard}>
      <View style={styles.cardContent}>
        <Image source={{ uri: item.workerImage }} style={styles.workerImage} />
        <View style={styles.bookingInfo}>
          <Text style={styles.workerName}>{item.workerName}</Text>
          <Text style={styles.serviceType}>{item.serviceType}</Text>
          <View style={styles.dateRow}>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={Colors.textSecondary}
            />
            <Text style={styles.date}>{item.date}</Text>
          </View>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.amount}>{item.amount} LKR</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status).background },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status).text },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionRow}>
        {item.isRated ? (
          <View style={styles.ratingDisplay}>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons
                  key={star}
                  name={star <= item.rating ? "star" : "star-outline"}
                  size={12}
                  color={star <= item.rating ? "#FFB800" : Colors.border}
                  style={{ marginRight: 2 }}
                />
              ))}
            </View>
            <Text style={styles.ratingText}>You rated {item.rating}/5</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.rateButton}
            onPress={() =>
              router.push({
                pathname: "/customer/rating-review",
                params: { workerName: item.workerName },
              })
            }
          >
            <Ionicons name="star-outline" size={14} color={Colors.primary} />
            <Text style={styles.rateButtonText}>Rate</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.chatButton}
          onPress={() => router.push("../chat")}
        >
          <Ionicons
            name="chatbubble-outline"
            size={14}
            color={Colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity style={styles.detailsButton}>
          <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
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
          <Text style={styles.heading}>Booking History</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(["All", "Completed", "Cancelled"] as BookingFilter[]).map(
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
        {selectedFilter === "All" && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Bookings</Text>
              <Text style={styles.statValue}>{bookings.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={styles.statValue}>
                {bookings.reduce((sum, b) => sum + b.amount, 0)} LKR
              </Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Avg Rating</Text>
              <Text style={styles.statValue}>
                {(
                  bookings
                    .filter((b) => b.isRated)
                    .reduce((sum, b) => sum + b.rating, 0) /
                    bookings.filter((b) => b.isRated).length || 0
                ).toFixed(1)}
              </Text>
            </View>
          </View>
        )}

        {/* Bookings List */}
        {filteredBookings.length > 0 ? (
          <FlatList
            data={filteredBookings}
            renderItem={renderBookingCard}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          />
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
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
});
