import AsyncStorage from "@react-native-async-storage/async-storage";
import { api, apiCall } from "@/constants/api";
import { useStore } from "@/constants/Store";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/Colors";

const COMPLAINTS_SEEN_KEY = "admin_complaints_seen_at";

export default function AdminLayout() {
  const { token } = useStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const [pendingComplaintsCount, setPendingComplaintsCount] = useState(0);
  const pathname = usePathname();
  const [lastDocumentVisit, setLastDocumentVisit] = useState(0);
  const [lastComplaintsVisit, setLastComplaintsVisit] = useState(0);
  const complaintsSeenAt = useRef(0);

  // Load persisted seen-at timestamp on mount, then start polling
  useEffect(() => {
    AsyncStorage.getItem(COMPLAINTS_SEEN_KEY).then((val) => {
      complaintsSeenAt.current = val ? parseInt(val, 10) : 0;
      fetchPendingComplaints();
    });

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 3000);
    const complaintsInterval = setInterval(fetchPendingComplaints, 30000);
    return () => {
      clearInterval(interval);
      clearInterval(complaintsInterval);
    };
  }, []);

  // Clear and refresh notification count when documents tab is accessed
  useEffect(() => {
    if (pathname?.includes("documents")) {
      const now = Date.now();
      if (now - lastDocumentVisit > 2000) {
        setLastDocumentVisit(now);
        setUnreadCount(0);
        const timer1 = setTimeout(fetchUnreadCount, 1500);
        const timer2 = setTimeout(fetchUnreadCount, 3000);
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    }
  }, [pathname]);

  // Clear complaints badge when complaints tab is visited and persist the timestamp
  useEffect(() => {
    if (pathname?.includes("complaints")) {
      const now = Date.now();
      if (now - lastComplaintsVisit > 2000) {
        setLastComplaintsVisit(now);
        complaintsSeenAt.current = now;
        AsyncStorage.setItem(COMPLAINTS_SEEN_KEY, String(now));
        setPendingComplaintsCount(0);
      }
    }
  }, [pathname]);

  const fetchUnreadCount = async () => {
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
  };

  const fetchPendingComplaints = async () => {
    if (!token) return;
    try {
      const response = await apiCall(api.complaints.getAll, "GET", undefined, token);
      const cutoff = complaintsSeenAt.current;
      const count = (response?.data || []).filter(
        (c: any) => c.status === "pending" && new Date(c.createdAt).getTime() > cutoff,
      ).length;
      setPendingComplaintsCount(count);
    } catch {
      // non-fatal
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="users"
        options={{
          title: "Users",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Documents",
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons
                name="document-text-outline"
                size={size}
                color={color}
              />
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="hardware"
        options={{
          title: "Hardware",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="complaints"
        options={{
          title: "Complaints",
          tabBarIcon: ({ color, size }) => (
            <View>
              <Ionicons name="flag-outline" size={size} color={color} />
              {pendingComplaintsCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>
                    {pendingComplaintsCount > 9 ? "9+" : pendingComplaintsCount}
                  </Text>
                </View>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    right: -6,
    top: -4,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  badgeText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
});
