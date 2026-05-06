import { api, apiCall } from "@/constants/api";
import { Colors } from "@/constants/Colors";
import { useStore } from "@/constants/Store";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";

export default function HardwareShopTabsLayout() {
  const token = useStore((s) => s.token);
  const [newPending, setNewPending] = useState(0);

  const fetchNewPending = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiCall(
        api.hardwareShop.getStats,
        "GET",
        undefined,
        token,
      );
      // Fall back to pendingOrders if backend hasn't been redeployed yet.
      const count =
        res?.data?.newPendingOrders ?? res?.data?.pendingOrders ?? 0;
      setNewPending(count);
    } catch {
      // silent
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchNewPending();
    const interval = setInterval(fetchNewPending, 20000);
    return () => clearInterval(interval);
  }, [token, fetchNewPending]);

  // When user taps Orders, mark them as viewed → badge clears.
  // New pending orders that arrive AFTER this tap will reappear.
  const handleOrdersTabPress = async () => {
    if (!token) return;
    setNewPending(0);
    try {
      await apiCall(
        api.hardwareShop.markOrdersViewed,
        "PUT",
        undefined,
        token,
      );
      await apiCall(
        api.notifications.markAllAsRead,
        "PUT",
        undefined,
        token,
      );
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
          tabBarBadge: newPending > 0 ? newPending : undefined,
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
