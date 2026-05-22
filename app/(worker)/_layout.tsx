import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { api, apiCall } from "../../constants/api";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";
import { useChatList } from "../../hooks/useChatList";

const DOCUMENT_NOTIFICATION_TYPES = [
  "DOCUMENT_UPLOADED",
  "DOCUMENT_VERIFIED",
  "DOCUMENT_REJECTED",
];

const JOB_NOTIFICATION_TYPES = [
  "JOB_ASSIGNED",
  "JOB_REQUESTED",
  "JOB_COMPLETED",
  "PAYMENT_RECEIVED",
  "REVIEW_RECEIVED",
  "GENERAL",
];

const HARDWARE_NOTIFICATION_TYPES = ["HARDWARE_REQUEST", "HARDWARE_ORDER"];

export default function WorkerLayout() {
  const { totalUnread } = useChatList();
  const token = useStore((s) => s.token);
  const unreadCancelled = useStore((s) => s.unreadCancelled);
  const lastSeenCancelled = useStore((s) => s.lastSeenCancelled);
  const setUnreadCancelled = useStore((s) => s.setUnreadCancelled);
  const setLastSeenCancelled = useStore((s) => s.setLastSeenCancelled);
  const [unreadJobs, setUnreadJobs] = useState(0);
  const [unreadDocuments, setUnreadDocuments] = useState(0);
  const [unreadHardware, setUnreadHardware] = useState(0);
  const visibleCancelled = Math.max(0, unreadCancelled - lastSeenCancelled);
  const jobsBadgeCount = unreadJobs + visibleCancelled;

  const fetchUnreadCount = useCallback(async () => {
    if (!token) return;
    try {
      const [jobsRes, docsRes, hwRes, cancelledRes] = await Promise.all([
        apiCall(
          `${api.notifications.getUnreadCount}?types=${JOB_NOTIFICATION_TYPES.join(",")}`,
          "GET",
          undefined,
          token,
        ),
        apiCall(
          `${api.notifications.getUnreadCount}?types=${DOCUMENT_NOTIFICATION_TYPES.join(",")}`,
          "GET",
          undefined,
          token,
        ),
        apiCall(
          `${api.notifications.getUnreadCount}?types=${HARDWARE_NOTIFICATION_TYPES.join(",")}`,
          "GET",
          undefined,
          token,
        ),
        apiCall(
          `${api.notifications.getUnreadCount}?types=JOB_CANCELLED`,
          "GET",
          undefined,
          token,
        ),
      ]);
      setUnreadJobs(jobsRes.count || 0);
      setUnreadDocuments(docsRes.count || 0);
      setUnreadHardware(hwRes.count || 0);
      setUnreadCancelled(cancelledRes.count || 0);
    } catch (error) {
      console.error("Error fetching notification count:", error);
    }
  }, [token, setUnreadCancelled]);

  useEffect(() => {
    if (!token) return;
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 3000);
    return () => clearInterval(interval);
  }, [token, fetchUnreadCount]);

  const handleJobsTabPress = async () => {
    // Dismiss the bottom-nav badge for cancellations without marking them
    // read on the server — that happens only when the Cancelled filter
    // inside the Jobs screen is actually opened.
    setLastSeenCancelled(unreadCancelled);

    if (!token || unreadJobs === 0) return;
    try {
      await apiCall(
        `${api.notifications.markAllAsRead}?types=${JOB_NOTIFICATION_TYPES.join(",")}`,
        "PUT",
        undefined,
        token,
      );
      setUnreadJobs(0);
    } catch (error) {
      console.error("Error marking notifications read:", error);
    }
  };

  const handleHardwareTabPress = async () => {
    if (!token || unreadHardware === 0) return;
    try {
      await apiCall(
        `${api.notifications.markAllAsRead}?types=${HARDWARE_NOTIFICATION_TYPES.join(",")}`,
        "PUT",
        undefined,
        token,
      );
      setUnreadHardware(0);
    } catch (error) {
      console.error("Error marking notifications read:", error);
    }
  };

  const handleDocumentsTabPress = async () => {
    if (!token || unreadDocuments === 0) return;
    try {
      await apiCall(
        `${api.notifications.markAllAsRead}?types=${DOCUMENT_NOTIFICATION_TYPES.join(",")}`,
        "PUT",
        undefined,
        token,
      );
      setUnreadDocuments(0);
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
          tabBarBadge: jobsBadgeCount > 0 ? jobsBadgeCount : undefined,
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
        listeners={{
          tabPress: (e: any) => {
            e.preventDefault();
          },
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
        name="hardware-updates"
        options={{
          title: "Hardware",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cube-outline" size={size} color={color} />
          ),
          tabBarBadge: unreadHardware > 0 ? unreadHardware : undefined,
          tabBarBadgeStyle: { backgroundColor: "#EF4444", color: "white" },
        }}
        listeners={{
          tabPress: () => {
            handleHardwareTabPress();
          },
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          title: "Documents",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text-outline" size={size} color={color} />
          ),
          tabBarBadge: unreadDocuments > 0 ? unreadDocuments : undefined,
          tabBarBadgeStyle: { backgroundColor: "#EF4444", color: "white" },
        }}
        listeners={{
          tabPress: () => {
            handleDocumentsTabPress();
          },
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
