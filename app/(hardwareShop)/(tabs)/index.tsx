import { api, apiCall } from "@/constants/api";
import { Colors } from "@/constants/Colors";
import { useStore } from "@/constants/Store";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HardwareShopDashboardScreen() {
  const router = useRouter();
  const { user, token, logout } = useStore();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    totalItems: 0,
    pendingOrders: 0,
    approvedOrders: 0,
    deliveredOrders: 0,
  });

  const fetchStats = async () => {
    try {
      if (!token) return;
      const response = await apiCall(
        api.hardwareShop.getStats,
        "GET",
        undefined,
        token,
      );
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchStats();
    }, [token]),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchStats();
    setRefreshing(false);
  }, [token]);

  const formatShopName = (name?: string) => {
    return name || "Your Shop";
  };

  const handleBack = () => {
    logout();
    router.replace("/(auth)/hardware-shop");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
            <View>
              <Text style={styles.welcomeText}>Welcome Back,</Text>
              <Text style={styles.shopName}>
                {formatShopName((user as any)?.shopName)}
              </Text>
            </View>
          </View>
          <Ionicons name="storefront" size={32} color={Colors.primary} />
        </View>

        {/* Stats Grid */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="cube" size={24} color={Colors.primary} />
                </View>
                <Text style={styles.statValue}>{stats.totalItems}</Text>
                <Text style={styles.statLabel}>Total Items</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="time" size={24} color="#FF9800" />
                </View>
                <Text style={styles.statValue}>{stats.pendingOrders}</Text>
                <Text style={styles.statLabel}>Pending Orders</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.statValue}>{stats.approvedOrders}</Text>
                <Text style={styles.statLabel}>Approved</Text>
              </View>

              <View style={styles.statCard}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="checkmark-done" size={24} color="#2196F3" />
                </View>
                <Text style={styles.statValue}>{stats.deliveredOrders}</Text>
                <Text style={styles.statLabel}>Delivered</Text>
              </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              <View style={styles.actionsGrid}>
                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() =>
                    router.push("/(hardwareShop)/(tabs)/inventory")
                  }
                >
                  <Ionicons
                    name="add-circle"
                    size={32}
                    color={Colors.primary}
                  />
                  <Text style={styles.actionLabel}>Add Item</Text>
                </Pressable>

                <Pressable
                  style={({ pressed }) => [
                    styles.actionButton,
                    pressed && { opacity: 0.7 },
                  ]}
                  onPress={() => router.push("/(hardwareShop)/(tabs)/orders")}
                >
                  <Ionicons name="list" size={32} color={Colors.primary} />
                  <Text style={styles.actionLabel}>View Orders</Text>
                </Pressable>
              </View>
            </View>

            {/* Info Section */}
            <View style={styles.infoSection}>
              <View style={styles.infoItem}>
                <Ionicons
                  name="information-circle"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.infoText}>
                  You have {stats.pendingOrders} pending orders to manage.
                </Text>
              </View>
            </View>
          </>
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
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  backBtn: {
    padding: 4,
  },
  welcomeText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  shopName: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 80,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 24,
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    width: "48%",
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f0f2f5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center",
  },
  actionsSection: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginTop: 8,
  },
  infoSection: {
    paddingHorizontal: 24,
  },
  infoItem: {
    flexDirection: "row",
    backgroundColor: "#F0F8FF",
    borderRadius: 8,
    padding: 12,
    alignItems: "flex-start",
    gap: 12,
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#333",
    flex: 1,
  },
});
