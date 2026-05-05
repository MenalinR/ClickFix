import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { api, apiCall } from "../../constants/api";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";
import { useChatList } from "../../hooks/useChatList";

export default function WorkerLayout() {
  const { totalUnread } = useChatList();
  const token = useStore((s) => s.token);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const response = await apiCall(
        api.notifications.getUnreadCount,
        "GET",
        undefined,
        token,
      );
      setUnreadNotifications(response.count || 0);
    } catch (error) {
      console.error("Error fetching notification count:", error);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [token, fetchUnreadCount]);

  const handleJobsTabPress = async () => {
    if (!token || unreadNotifications === 0) return;
    try {
      await apiCall(
        api.notifications.markAllAsRead,
        "PUT",
        undefined,
        token,
      );
      setUnreadNotifications(0);
    } catch (error) {
      console.error("Error marking notifications read:", error);
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
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="job-requests"
        options={{
          title: "Jobs",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="briefcase-outline" size={size} color={color} />
          ),
          tabBarBadge:
            unreadNotifications > 0 ? unreadNotifications : undefined,
          tabBarBadgeStyle: { backgroundColor: "#EF4444", color: "white" },
        }}
        listeners={{
          tabPress: () => {
            handleJobsTabPress();
          },
        }}
      />
      <Tabs.Screen
        name="earnings"
        options={{
          title: "Earnings",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="wallet-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: "Schedule",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="chatbubbles-outline" size={size} color={color} />
          ),
          tabBarBadge: totalUnread > 0 ? totalUnread : undefined,
          tabBarBadgeStyle: { backgroundColor: "#EF4444", color: "white" },
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Documents",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Hidden screens for navigation */}
      <Tabs.Screen
        name="job-details"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="hardware-request"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="order-hardware"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
