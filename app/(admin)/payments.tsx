import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";

const methodIcon = (method: string): keyof typeof Ionicons.glyphMap => {
  if (method === "card") return "card-outline";
  if (method === "wallet") return "wallet-outline";
  if (method === "online") return "globe-outline";
  return "cash-outline";
};

const methodLabel = (method: string) => {
  if (method === "card" || method === "online") return "Card";
  if (method === "wallet") return "Wallet";
  return "Cash";
};

const dayKey = (d: Date) =>
  d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const timeStr = (d: Date) =>
  d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

// payment.amount is captured at the moment of payment (see payJobBooking /
// payhereNotify) and is the authoritative record of what was actually
// charged — prefer it. For jobs paid before that field existed, don't trust
// pricing.totalAmount on its own: several backend handlers update it via a
// non-atomic load-mutate-save, and a race between two of them (e.g. a
// hardware order landing while the transport fee is being computed) can
// leave it stuck at a stale/zero value even though the individual
// serviceCharge/hardwareCost/transportFee fields are all correct. Deriving
// the total from those parts is more reliable than trusting the aggregate.
const amountOf = (job: any) => {
  if (job?.payment?.amount) return job.payment.amount;
  const p = job?.pricing || {};
  const serviceCost = p.serviceCharge || p.negotiatedPrice || p.proposedPrice || 0;
  const derived = serviceCost + (p.hardwareCost || 0) + (p.transportFee || 0);
  return derived || p.totalAmount || 0;
};

export default function AdminPayments() {
  const router = useRouter();
  const { jobs = [], fetchJobs, token } = useStore();
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!token) return;
      setLoading(true);
      fetchJobs().finally(() => setLoading(false));
    }, [token, fetchJobs]),
  );

  const paidJobs = useMemo(
    () =>
      (Array.isArray(jobs) ? jobs : [])
        .filter((j: any) => j?.payment?.status === "completed")
        .map((j: any) => ({
          job: j,
          paidAt: new Date(j.payment.paidAt || j.updatedAt || j.createdAt),
        }))
        .sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime()),
    [jobs],
  );

  const totalCollected = useMemo(
    () =>
      paidJobs.reduce(
        (sum, { job }) => sum + amountOf(job),
        0,
      ),
    [paidJobs],
  );

  const groups = useMemo(() => {
    const map = new Map<string, typeof paidJobs>();
    for (const entry of paidJobs) {
      const key = dayKey(entry.paidAt);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(entry);
    }
    return Array.from(map.entries());
  }, [paidJobs]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerRow}>
        <Ionicons
          name="arrow-back"
          size={24}
          color={Colors.primary}
          onPress={() => router.replace("/(admin)")}
          style={styles.backButton}
        />
        <Text style={styles.heading}>Payments</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.summaryCard}>
        <View>
          <Text style={styles.summaryLabel}>Total Collected</Text>
          <Text style={styles.summaryValue}>
            {totalCollected.toLocaleString()} LKR
          </Text>
        </View>
        <View style={styles.summaryDivider} />
        <View>
          <Text style={styles.summaryLabel}>Payments</Text>
          <Text style={styles.summaryValue}>{paidJobs.length}</Text>
        </View>
      </View>

      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {loading && paidJobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : paidJobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="cash-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>No payments yet</Text>
          </View>
        ) : (
          groups.map(([date, entries]) => {
            const dayTotal = entries.reduce(
              (sum, { job }) => sum + amountOf(job),
              0,
            );
            return (
              <View key={date} style={styles.dateGroup}>
                <View style={styles.dateHeaderRow}>
                  <Text style={styles.dateHeader}>{date}</Text>
                  <Text style={styles.dateTotal}>
                    {dayTotal.toLocaleString()} LKR
                  </Text>
                </View>
                {entries.map(({ job, paidAt }) => {
                  const id = job._id || job.id;
                  const workerName =
                    job.workerId?.name || job.requestedWorkerId?.name || "Unassigned";
                  const amount = amountOf(job);
                  return (
                    <View key={id} style={styles.paymentCard}>
                      <View style={styles.paymentIconWrap}>
                        <Ionicons
                          name={methodIcon(job.payment?.method)}
                          size={20}
                          color={Colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.workerName}>{workerName}</Text>
                        <Text style={styles.serviceText}>
                          {job.serviceType || "—"} · {timeStr(paidAt)}
                        </Text>
                      </View>
                      <View style={styles.amountCol}>
                        <Text style={styles.amountText}>
                          {amount.toLocaleString()} LKR
                        </Text>
                        <Text style={styles.methodText}>
                          {methodLabel(job.payment?.method)}
                        </Text>
                      </View>
                    </View>
                  );
                })}
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
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 10,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
  },
  summaryCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    gap: 20,
  },
  summaryLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.text,
  },
  summaryDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: Colors.border,
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
  dateGroup: {
    marginBottom: 20,
  },
  dateHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  dateHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.textSecondary,
    textTransform: "uppercase",
  },
  dateTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  paymentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  paymentIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  workerName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.text,
  },
  serviceText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  amountCol: {
    alignItems: "flex-end",
  },
  amountText: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  methodText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
