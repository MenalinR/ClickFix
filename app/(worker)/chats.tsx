import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { ChatSummary, useChatList } from "../../hooks/useChatList";

export default function WorkerChatsScreen() {
  const router = useRouter();
  const { chats, loading } = useChatList();

  const renderItem = ({ item }: { item: ChatSummary }) => {
    const otherName = item.otherUser?.name || "Customer";
    const lastText =
      item.lastMessage?.messageType === "text"
        ? item.lastMessage?.content
        : item.lastMessage?.messageType || "";
    const when = item.lastMessage?.createdAt
      ? new Date(item.lastMessage.createdAt).toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";
    const customerId = item.otherUser?._id || item.otherUser?.id || "";
    return (
      <TouchableOpacity
        style={styles.row}
        onPress={() =>
          router.push({
            pathname: "/(worker)/chat",
            params: {
              jobId: item.chatId,
              customerId: String(customerId),
              customerName: otherName,
            },
          } as any)
        }
      >
        <View style={styles.avatar}>
          <Ionicons name="person" size={22} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.rowHead}>
            <Text style={styles.name}>{otherName}</Text>
            <Text style={styles.time}>{when}</Text>
          </View>
          <View style={styles.rowFoot}>
            <Text style={styles.preview} numberOfLines={1}>
              {lastText || "Start chatting"}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.unreadCount > 9 ? "9+" : item.unreadCount}
                </Text>
              </View>
            )}
          </View>
          {!!item.job?.serviceType && (
            <Text style={styles.sub}>
              {item.job.serviceType} · {item.job.status}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.heading}>Chats</Text>
      {loading && chats.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : chats.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons
            name="chatbubbles-outline"
            size={48}
            color={Colors.textSecondary}
          />
          <Text style={styles.emptyText}>No chats yet</Text>
          <Text style={styles.emptySub}>
            Chats appear once customers message you about a booking.
          </Text>
        </View>
      ) : (
        <FlatList
          data={chats}
          renderItem={renderItem}
          keyExtractor={(c) => c.chatId}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
  },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  emptyText: { fontSize: 15, fontWeight: "700", color: Colors.text },
  emptySub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    padding: 12,
    gap: 12,
    backgroundColor: Colors.white,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.lightBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  rowHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: { fontSize: 14, fontWeight: "700", color: Colors.text },
  time: { fontSize: 11, color: Colors.textSecondary },
  rowFoot: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  preview: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  sub: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    paddingHorizontal: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "white", fontSize: 10, fontWeight: "700" },
});
