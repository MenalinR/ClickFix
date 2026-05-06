import { api, apiCall } from "@/constants/api";
import { Colors } from "@/constants/Colors";
import { useStore } from "@/constants/Store";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";

export default function HardwareShopTabsLayout() {
  const token = useStore((s) => s.token);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiCall(
        api.notifications.getUnreadCount,
        "GET",
        undefined,
        token,
      );
      setUnreadCount(res?.count || 0);
    } catch {
      // silent
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchUnread();
    const interval = setInterval(fetchUnread, 20000);
    return () => clearInterval(interval);
  }, [token, fetchUnread]);

  const handleOrdersTabPress = async () => {
    if (!token || unreadCount === 0) return;
    try {
      await apiCall(
        api.notifications.markAllAsRead,
        "PUT",
        undefined,
        token,
      );
      setUnreadCount(0);
    } catch {
      // silent
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: "#999",
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: "Inter_600SemiBold",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="grid" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="inventory"
        options={{
          title: "Inventory",
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="cube" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="orders"
        options={{
          title: "Orders",
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="list" color={color} />
          ),
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: "#EF4444", color: "white" },
        }}
        listeners={{
          tabPress: () => {
            handleOrdersTabPress();
          },
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons size={24} name="person" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
