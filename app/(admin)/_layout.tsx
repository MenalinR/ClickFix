import { api, apiCall } from "@/constants/api";
import { useStore } from "@/constants/Store";
import { Ionicons } from "@expo/vector-icons";
import { Tabs, usePathname } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Colors } from "../../constants/Colors";

export default function AdminLayout() {
  const { token } = useStore();
  const [unreadCount, setUnreadCount] = useState(0);
  const pathname = usePathname();
  const [lastDocumentVisit, setLastDocumentVisit] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Clear and refresh notification count when documents tab is accessed
  useEffect(() => {
    if (pathname?.includes("documents")) {
      const now = Date.now();
      // Prevent multiple rapid clears
      if (now - lastDocumentVisit > 2000) {
        setLastDocumentVisit(now);
        // Clear badge immediately for instant feedback
        setUnreadCount(0);
        // Refresh multiple times to ensure notifications are marked as read
        const timer1 = setTimeout(fetchUnreadCount, 1500);
        const timer2 = setTimeout(fetchUnreadCount, 3000);
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
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
