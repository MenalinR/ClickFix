import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";

export default function AdminDashboard() {
  const router = useRouter();
  const { workers, bookings } = useStore();

  const totalWorkers = workers.length;
  const totalBookings = bookings?.length || 0;
  const activeBookings =
    bookings?.filter((b) => b.status === "pending" || b.status === "confirmed")
      .length || 0;
  const completedBookings =
    bookings?.filter((b) => b.status === "completed").length || 0;

  const stats = [
    {
      icon: "people",
      label: "Total Workers",
      value: totalWorkers,
      color: Colors.primary,
    },
    {
      icon: "calendar",
      label: "Total Bookings",
      value: totalBookings,
      color: Colors.accent,
    },
    {
      icon: "time",
      label: "Active Bookings",
      value: activeBookings,
      color: "#FF6B6B",
    },
    {
      icon: "checkmark-circle",
      label: "Completed",
      value: completedBookings,
      color: "#4CAF50",
    },
  ];

  const recentActivity = [
    {
      id: 1,
      type: "worker",
      text: "New worker registered",
      time: "2 hours ago",
    },
    { id: 2, type: "booking", text: "Booking completed", time: "4 hours ago" },
    {
      id: 3,
      type: "user",
      text: "New customer registered",
      time: "6 hours ago",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.heading}>Admin Dashboard</Text>
            <Text style={styles.subheading}>Welcome back, Admin</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/login")}
            style={styles.logoutButton}
          >
            <Ionicons name="log-out-outline" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCard}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: stat.color + "20" },
                ]}
              >
                <Ionicons
                  name={stat.icon as any}
                  size={28}
                  color={stat.color}
                />
              </View>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(admin)/users")}
          >
            <Ionicons
              name="person-add-outline"
              size={32}
              color={Colors.primary}
            />
            <Text style={styles.actionText}>Add Worker</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(admin)/bookings")}
          >
            <Ionicons name="calendar-outline" size={32} color={Colors.accent} />
            <Text style={styles.actionText}>View Bookings</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(admin)/hardware")}
          >
            <Ionicons name="cube-outline" size={32} color="#FF9800" />
            <Text style={styles.actionText}>Hardware Shop</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push("/(admin)/settings")}
          >
            <Ionicons name="settings-outline" size={32} color="#FF6B6B" />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity */}
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityContainer}>
          {recentActivity.map((activity) => (
            <View key={activity.id} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons
                  name={
                    activity.type === "worker"
                      ? "person"
                      : activity.type === "booking"
                        ? "calendar"
                        : "people"
                  }
                  size={20}
                  color={Colors.primary}
                />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityText}>{activity.text}</Text>
                <Text style={styles.activityTime}>{activity.time}</Text>
              </View>
            </View>
          ))}
        </View>
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
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 4,
  },
  subheading: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  logoutButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.card,
    justifyContent: "center",
    alignItems: "center",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: "center",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 16,
    marginTop: 8,
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  actionCard: {
    width: "48%",
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    marginTop: 12,
    textAlign: "center",
  },
  activityContainer: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 16,
  },
  activityItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: Colors.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
