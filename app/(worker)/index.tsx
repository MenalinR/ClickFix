import { api, apiCall } from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
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

export default function WorkerDashboard() {
  const router = useRouter();
  const { jobs, updateJobStatus, user, token, fetchJobs, logout } = useStore();
  const workerId = user?.id || user?._id || "1"; // Get logged-in worker's id
  const workerName = user?.name || "Professional";
  const workerCategory = (user as any)?.category || "Worker";
  const [unreadCount, setUnreadCount] = useState(0);

  const statusOf = (j: any) => (j.status || "").toLowerCase();
  const isMine = (j: any) =>
    (j.workerId as any)?._id === workerId ||
    (j.workerId as any) === workerId;
  const pendingJobs = jobs.filter((j) => statusOf(j) === "pending");
  const acceptedJobs = jobs.filter(
    (j) => statusOf(j) === "accepted" && isMine(j),
  );
  const earnings = jobs
    .filter((j) => statusOf(j) === "completed" && isMine(j))
    .reduce(
      (acc, j) =>
        acc +
        ((j as any).pricing?.totalAmount ??
          (j as any).pricing?.serviceCharge ??
          (j as any).price ??
          0),
      0,
    );
  const completedCount = jobs.filter(
    (j) => statusOf(j) === "completed" && isMine(j),
  ).length;

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const response = await apiCall(
        api.notifications.getUnreadCount,
        "GET",
        undefined,
        token,
      );
      setUnreadCount(response.count || 0);
    } catch (error) {
      console.error("Error fetching notification count:", error);
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      fetchUnreadCount();
      if (token) fetchJobs();
      if (!token) return;
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }, [token, fetchUnreadCount, fetchJobs]),
  );

  const handleGoLanding = () => {
    router.dismissAll();
    router.replace("/");
    logout();
  };

  const handleOpenNotifications = async () => {
    if (token) {
      try {
        await apiCall(
          api.notifications.markAllAsRead,
          "PUT",
          undefined,
          token,
        );
        setUnreadCount(0);
      } catch (error) {
        console.error("Error marking notifications read:", error);
      }
    }
    router.push("/job-requests");
  };


  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View style={styles.headingLeft}>
            <Text style={styles.heading}>Dashboard</Text>
          </View>
          <View style={styles.headerIcons}>
          <TouchableOpacity
            style={styles.homeIconBtn}
            onPress={handleGoLanding}
          >
            <Ionicons name="home" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleOpenNotifications}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={Colors.primary}
            />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          </View>
        </View>

        {/* Welcome Message */}
        <View style={styles.welcomeCard}>
          <View>
            <Text style={styles.welcomeText}>Welcome back! 👋</Text>
            <Text style={styles.welcomeSubtext}>
              {workerName} ({workerCategory})
            </Text>
          </View>
          <Text style={styles.welcomeEmoji}>🔧</Text>
        </View>

        {/* Key Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{completedCount}</Text>
            <Text style={styles.statLabel}>Jobs Done</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{earnings}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pendingJobs.length}</Text>
            <Text style={styles.statLabel}>New Requests</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push("/job-requests")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#E3F2FD" }]}>
              <Ionicons
                name="briefcase-outline"
                size={28}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.actionLabel}>Job Requests</Text>
            {pendingJobs.length > 0 && (
              <Text style={styles.actionBadge}>{pendingJobs.length}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push("/chat")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#F3E5F5" }]}>
              <Ionicons name="chatbubble-outline" size={28} color="#9C27B0" />
            </View>
            <Text style={styles.actionLabel}>Messages</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push("/earnings")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="wallet-outline" size={28} color="#4CAF50" />
            </View>
            <Text style={styles.actionLabel}>Earnings</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.navigate("/schedule")}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#FFF3E0" }]}>
              <Ionicons name="calendar-outline" size={28} color="#FF9800" />
            </View>
            <Text style={styles.actionLabel}>Schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Pending Jobs</Text>
            <TouchableOpacity onPress={() => router.push("/job-requests")}>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {pendingJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📭</Text>
              <Text style={styles.emptyText}>No pending requests</Text>
              <Text style={styles.emptySubtext}>
                Check back soon for new opportunities!
              </Text>
            </View>
          ) : (
            pendingJobs.slice(0, 2).map((job) => (
              <TouchableOpacity
                key={job.id}
                style={styles.jobCard}
                onPress={() =>
                  router.push({
                    pathname: "/job-details",
                    params: { jobId: job.id },
                  })
                }
              >
                <View style={styles.jobCardContent}>
                  <View>
                    <Text style={styles.jobTitle}>{job.serviceType}</Text>
                    <Text style={styles.jobDesc}>
                      {(job as any).customerName || "Customer"}
                    </Text>
                    <Text style={styles.jobPrice}>
                      {(job as any).price || 0} LKR
                    </Text>
                  </View>
                  <View style={styles.jobAction}>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors.primary}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Active Jobs */}
        {acceptedJobs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Active Jobs ({acceptedJobs.length})
            </Text>
            {acceptedJobs.slice(0, 2).map((job) => (
              <TouchableOpacity
                key={job.id}
                style={[styles.jobCard, styles.activeJobCard]}
                onPress={() =>
                  router.push({
                    pathname: "/job-details",
                    params: { jobId: job.id },
                  })
                }
              >
                <View style={styles.jobCardContent}>
                  <View>
                    <Text style={styles.jobTitle}>{job.serviceType}</Text>
                    <Text style={styles.jobDesc}>
                      {(job as any).customerName || "Customer"}
                    </Text>
                    <Text style={styles.jobStatus}>In Progress</Text>
                  </View>
                  <View style={styles.jobAction}>
                    <Ionicons
                      name="chevron-forward"
                      size={20}
                      color={Colors.primary}
                    />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
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
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
  },
  headingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    padding: 4,
  },
  notificationButton: {
    padding: 8,
    position: "relative",
  },
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  homeIconBtn: {
    padding: 4,
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  welcomeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  welcomeSubtext: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 4,
  },
  welcomeEmoji: {
    fontSize: 40,
  },
  statsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    padding: 16,
    backgroundColor: "white",
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statNumber: {
    color: Colors.text,
    fontSize: 18,
    fontWeight: "bold",
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 11,
    marginTop: 4,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 24,
  },
  quickActionCard: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
  },
  actionBadge: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeAllText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  jobCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  activeJobCard: {
    borderLeftColor: "#4CAF50",
  },
  jobCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  jobTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 4,
  },
  jobDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  jobPrice: {
    fontSize: 13,
    fontWeight: "bold",
    color: Colors.primary,
  },
  jobStatus: {
    fontSize: 12,
    fontWeight: "600",
    color: "#4CAF50",
  },
  jobAction: {
    padding: 8,
  },
});
