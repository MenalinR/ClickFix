import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback } from "react";
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

  useFocusEffect(
    useCallback(() => {
      if (token) fetchJobs();
    }, [token, fetchJobs]),
  );

  const handleGoLanding = () => {
    router.dismissAll();
    router.replace("/");
    logout();
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
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickActionCard}
            onPress={() => router.push("/(worker)/chats" as any)}
          >
            <View style={[styles.actionIcon, { backgroundColor: "#F3E5F5" }]}>
              <Ionicons name="chatbubble-outline" size={28} color="#9C27B0" />
            </View>
            <Text style={styles.actionLabel}>Messages</Text>
          </TouchableOpacity>

          <View style={styles.quickActionCard}>
            <View style={[styles.actionIcon, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="wallet-outline" size={28} color="#4CAF50" />
            </View>
            <Text style={styles.actionLabel}>Earnings</Text>
          </View>

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

        {/* Active Jobs */}
        {acceptedJobs.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Active Jobs ({acceptedJobs.length})
            </Text>
            {acceptedJobs.slice(0, 2).map((job) => {
              const jobId = (job as any)._id || job.id;
              return (
                <TouchableOpacity
                  key={jobId}
                  style={[styles.jobCard, styles.activeJobCard]}
                  onPress={() =>
                    router.push({
                      pathname: "/job-details",
                      params: { jobId },
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
              );
            })}
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
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
  headerIcons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  homeIconBtn: {
    padding: 4,
  },
  welcomeCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: Colors.primary,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  welcomeSubtext: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.85)",
    marginTop: 4,
  },
  welcomeEmoji: {
    fontSize: 44,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    paddingVertical: 18,
    paddingHorizontal: 8,
    backgroundColor: "white",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 90,
  },
  statNumber: {
    color: Colors.primary,
    fontSize: 24,
    fontWeight: "800",
  },
  statLabel: {
    color: Colors.textSecondary,
    fontSize: 12,
    fontWeight: "500",
    marginTop: 6,
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 14,
  },
  quickActionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 12,
    marginBottom: 24,
  },
  quickActionCard: {
    width: "48.5%",
    backgroundColor: "white",
    borderRadius: 14,
    paddingVertical: 22,
    paddingHorizontal: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 120,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    textAlign: "center",
  },
  actionBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "#EF4444",
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 5,
    overflow: "hidden",
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
