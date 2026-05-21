import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { api, apiCall } from "../../../constants/api";
import { Colors } from "../../../constants/Colors";
import { useStore } from "../../../constants/Store";
import { useChatList } from "../../../hooks/useChatList";

const BOOKING_NOTIFICATION_TYPES = ["JOB_CANCELLED", "JOB_ASSIGNED", "JOB_COMPLETED"];

function ChatsIcon({ color, size }: { color: string; size: number }) {
  const { totalUnread } = useChatList();
  return (
    <View>
      <Ionicons name="chatbubbles-outline" size={size} color={color} />
      {totalUnread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {totalUnread > 9 ? "9+" : totalUnread}
          </Text>
        </View>
      )}
    </View>
  );
}

function BookingsIcon({
  color,
  size,
  unread,
}: {
  color: string;
  size: number;
  unread: number;
}) {
  return (
    <View>
      <Ionicons name="calendar-outline" size={size} color={color} />
      {unread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unread > 9 ? "9+" : unread}</Text>
        </View>
      )}
    </View>
  );
}

export default function CustomerTabsLayout() {
  const token = useStore((s) => s.token);
  const [unreadBookings, setUnreadBookings] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiCall(
        `${api.notifications.getUnreadCount}?types=${BOOKING_NOTIFICATION_TYPES.join(",")}`,
        "GET",
        undefined,
        token,
      );
      setUnreadBookings(res?.count || 0);
    } catch (error) {
      console.error("Error fetching booking notification count:", error);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [token, fetchUnreadCount]);

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
          title: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ color, size }) => (
            <BookingsIcon color={color} size={size} unread={unreadBookings} />
          ),
        }}
        listeners={{
          tabPress: () => {
            setTimeout(fetchUnreadCount, 500);
          },
        }}
      />
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
          tabBarIcon: ChatsIcon,
        }}
      />
      <Tabs.Screen
        name="hardware"
        options={{
          href: null,
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
    </Tabs>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    right: -6,
    top: -4,
    backgroundColor: "#EF4444",
    borderRadius: 9,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: { color: "white", fontSize: 9, fontWeight: "700" },
});
