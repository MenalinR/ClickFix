import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
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

export default function EarningsPage() {
  const router = useRouter();
  const { jobs } = useStore();
  const workerId = "1"; // TODO: Replace with real logged-in worker's id
  const [period, setPeriod] = useState<"today" | "week" | "month">("month");

  const completedJobs = jobs.filter(
    (j) => j.status === "Completed" && j.workerId === workerId,
  );

  // Calculate earnings by period
  const getEarningsByPeriod = () => {
    const now = new Date();

    if (period === "today") {
      return completedJobs.filter((j) => {
        const jobDate = new Date(j.requestedDate || j.date);
        return jobDate.toDateString() === now.toDateString();
      });
    } else if (period === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return completedJobs.filter((j) => {
        const jobDate = new Date(j.requestedDate || j.date);
        return jobDate >= weekAgo && jobDate <= now;
      });
    } else {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return completedJobs.filter((j) => {
        const jobDate = new Date(j.requestedDate || j.date);
        return jobDate >= monthAgo && jobDate <= now;
      });
    }
  };

  const filteredJobs = getEarningsByPeriod();
  const totalEarnings = filteredJobs.reduce((acc, j) => acc + j.price, 0);
  const totalJobs = filteredJobs.length;
  const averagePerJob =
    totalJobs > 0 ? Math.round(totalEarnings / totalJobs) : 0;

  // Mock payment history
  const paymentHistory = [
    {
      id: "1",
      date: "Feb 8, 2026",
      amount: 2500,
      status: "Completed",
      type: "Plumbing",
    },
    {
      id: "2",
      date: "Feb 7, 2026",
      amount: 1800,
      status: "Completed",
      type: "Electrical",
    },
    {
      id: "3",
      date: "Feb 6, 2026",
      amount: 3200,
      status: "Pending",
      type: "Carpentry",
    },
    {
      id: "4",
      date: "Feb 5, 2026",
      amount: 2000,
      status: "Completed",
      type: "Plumbing",
    },
    {
      id: "5",
      date: "Feb 4, 2026",
      amount: 1500,
      status: "Completed",
      type: "Electrical",
    },
  ];

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
          <Text style={styles.heading}>Earnings</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {(["today", "week", "month"] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[
                styles.periodButton,
                period === p && styles.periodButtonActive,
              ]}
              onPress={() => setPeriod(p)}
            >
              <Text
                style={[
                  styles.periodText,
                  period === p && styles.periodTextActive,
                ]}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total Earnings Card */}
        <View style={styles.totalCard}>
          <View>
            <Text style={styles.totalLabel}>Total Earnings</Text>
            <Text style={styles.totalAmount}>{totalEarnings} LKR</Text>
            <Text style={styles.totalSubtext}>
              {totalJobs} completed {totalJobs === 1 ? "job" : "jobs"}
            </Text>
          </View>
          <View style={styles.earningsBadge}>
            <Ionicons name="wallet-outline" size={32} color={Colors.primary} />
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="briefcase-outline"
                size={24}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.statLabel}>Total Jobs</Text>
            <Text style={styles.statValue}>{totalJobs}</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="trending-up-outline"
                size={24}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.statLabel}>Avg per Job</Text>
            <Text style={styles.statValue}>{averagePerJob} LKR</Text>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statIcon}>
              <Ionicons
                name="calendar-outline"
                size={24}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.statLabel}>Period</Text>
            <Text style={styles.statValue}>{period}</Text>
          </View>
        </View>

        {/* Chart Placeholder */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Earnings Trend</Text>
          <View style={styles.chartPlaceholder}>
            <View style={[styles.bar, { height: "40%" }]} />
            <View style={[styles.bar, { height: "60%" }]} />
            <View style={[styles.bar, { height: "35%" }]} />
            <View style={[styles.bar, { height: "75%" }]} />
            <View style={[styles.bar, { height: "50%" }]} />
          </View>
        </View>

        {/* Payment History */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Payment History</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See all</Text>
            </TouchableOpacity>
          </View>

          {paymentHistory.slice(0, 5).map((payment) => (
            <View key={payment.id} style={styles.paymentItem}>
              <View style={styles.paymentLeft}>
                <View
                  style={[
                    styles.paymentIcon,
                    {
                      backgroundColor:
                        payment.type === "Plumbing"
                          ? "#E3F2FD"
                          : payment.type === "Electrical"
                            ? "#FFF3E0"
                            : "#E8F5E9",
                    },
                  ]}
                >
                  <Text style={styles.paymentTypeEmoji}>
                    {payment.type === "Plumbing"
                      ? "🚰"
                      : payment.type === "Electrical"
                        ? "⚡"
                        : "🔨"}
                  </Text>
                </View>
                <View>
                  <Text style={styles.paymentType}>{payment.type}</Text>
                  <Text style={styles.paymentDate}>{payment.date}</Text>
                </View>
              </View>
              <View style={styles.paymentRight}>
                <Text style={styles.paymentAmount}>+{payment.amount} LKR</Text>
                <View
                  style={[
                    styles.paymentStatus,
                    {
                      backgroundColor:
                        payment.status === "Completed" ? "#E8F5E9" : "#FFF3E0",
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.paymentStatusText,
                      {
                        color:
                          payment.status === "Completed"
                            ? "#4CAF50"
                            : "#FF9800",
                      },
                    ]}
                  >
                    {payment.status === "Completed" ? "✓" : "⏳"}{" "}
                    {payment.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Pending Amount Card */}
        <View style={styles.pendingCard}>
          <View>
            <Text style={styles.pendingLabel}>Pending Payments</Text>
            <Text style={styles.pendingAmount}>3,200 LKR</Text>
          </View>
          <TouchableOpacity style={styles.withdrawButton}>
            <Text style={styles.withdrawButtonText}>Withdraw</Text>
          </TouchableOpacity>
        </View>

        {/* Additional Info */}
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={Colors.primary}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoTitle}>How payments work?</Text>
            <Text style={styles.infoText}>
              Payments are transferred to your registered bank account within
              24-48 hours after job completion.
            </Text>
          </View>
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
  periodSelector: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.lightBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  periodText: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
    color: Colors.textSecondary,
  },
  periodTextActive: {
    color: "white",
  },
  totalCard: {
    backgroundColor: Colors.primary,
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 6,
  },
  totalAmount: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
  },
  totalSubtext: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
  earningsBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightBackground,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
    textAlign: "center",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.text,
    textAlign: "center",
  },
  chartCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 16,
  },
  chartPlaceholder: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-around",
    height: 120,
  },
  bar: {
    width: 40,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
  },
  seeAllText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },
  paymentItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  paymentTypeEmoji: {
    fontSize: 20,
  },
  paymentType: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  paymentDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  paymentRight: {
    alignItems: "flex-end",
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4CAF50",
    marginBottom: 4,
  },
  paymentStatus: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  paymentStatusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  pendingCard: {
    backgroundColor: "#FFF3E0",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#FFB74D",
  },
  pendingLabel: {
    fontSize: 13,
    color: "#E65100",
  },
  pendingAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FF6F00",
    marginTop: 4,
  },
  withdrawButton: {
    backgroundColor: "#FF6F00",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  withdrawButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#90CAF9",
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1976D2",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    color: "#1565C0",
    lineHeight: 16,
  },
});
