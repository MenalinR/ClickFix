import { NegotiationBanner } from "@/components/NegotiationBanner";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, apiCall } from "../../constants/api";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";
import { useChat } from "../../hooks/useChat";

export default function CustomerChatPage() {
  const router = useRouter();
  const { token } = useStore();
  const params = useLocalSearchParams<{
    jobId?: string;
    workerId?: string;
    workerName?: string;
  }>();
  const jobId = typeof params.jobId === "string" ? params.jobId : "";
  const workerId = typeof params.workerId === "string" ? params.workerId : "";
  const initialName =
    typeof params.workerName === "string" ? params.workerName : "";
  const flatListRef = useRef<FlatList>(null);
  const [text, setText] = useState("");
  const [workerName, setWorkerName] = useState(initialName);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  useEffect(() => {
    if (workerName || !workerId || !token) return;
    (async () => {
      try {
        const res = await apiCall(
          api.workers.getById(workerId),
          "GET",
          undefined,
          token,
        );
        const name = res?.data?.name || res?.name;
        if (name) setWorkerName(name);
      } catch {
        // silent
      }
    })();
  }, [workerName, workerId, token]);

  const {
    messages,
    loading,
    sending,
    typing,
    sendMessage,
    respondToCart,
    emitTyping,
    myId,
  } = useChat({ jobId, otherUserId: workerId, otherUserModel: "Worker" });

  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg || sending) return;
    setText("");
    await sendMessage(msg);
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const handleCartResponse = async (
    messageId: string,
    action: "approve" | "reject",
  ) => {
    if (!messageId) return;
    setRespondingTo(messageId);
    try {
      await respondToCart(messageId, action);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not respond to cart");
    } finally {
      setRespondingTo(null);
    }
  };

  const renderCartBubble = (item: any, isMine: boolean) => {
    const items = (item.cartItems || []) as any[];
    const total = items.reduce(
      (sum, it) => sum + (it.price || 0) * (it.quantity || 1),
      0,
    );
    const status = item.cartStatus || "pending";
    const isResponding = respondingTo === item._id;

    return (
      <View style={styles.cartCard}>
        <View style={styles.cartHeader}>
          <Ionicons name="cube-outline" size={16} color={Colors.primary} />
          <Text style={styles.cartTitle}>Hardware Suggestion from Worker</Text>
        </View>
        {items.map((it, idx) => (
          <View key={idx} style={styles.cartRow}>
            <Text style={styles.cartItemName} numberOfLines={1}>
              {it.name}
            </Text>
            <Text style={styles.cartItemQty}>×{it.quantity || 1}</Text>
            <Text style={styles.cartItemPrice}>
              {(it.price || 0) * (it.quantity || 1)} LKR
            </Text>
          </View>
        ))}
        <View style={styles.cartTotalRow}>
          <Text style={styles.cartTotalLabel}>Total</Text>
          <Text style={styles.cartTotalValue}>{total} LKR</Text>
        </View>

        {!isMine && status === "pending" ? (
          <View style={styles.cartActions}>
            <TouchableOpacity
              style={[styles.cartBtn, styles.cartBtnReject]}
              onPress={() => handleCartResponse(item._id, "reject")}
              disabled={isResponding}
            >
              {isResponding ? (
                <ActivityIndicator size="small" color="#C73E3A" />
              ) : (
                <Text style={styles.cartBtnRejectText}>Decline</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cartBtn, styles.cartBtnApprove]}
              onPress={() => handleCartResponse(item._id, "approve")}
              disabled={isResponding}
            >
              {isResponding ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.cartBtnApproveText}>Approve</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <Text
            style={[
              styles.cartStatusBadge,
              status === "approved" && { color: "#22A06B" },
              status === "rejected" && { color: "#C73E3A" },
            ]}
          >
            {status === "pending"
              ? "Awaiting your approval"
              : status === "approved"
                ? "✓ Added to your bill"
                : "✗ Declined"}
          </Text>
        )}
      </View>
    );
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMine =
      String(item.senderId?._id || item.senderId) === String(myId) ||
      item.senderModel === "Customer";

    if (item.messageType === "hardware-cart") {
      return (
        <View
          style={[
            styles.messageContainer,
            isMine && styles.messageContainerRight,
          ]}
        >
          {renderCartBubble(item, isMine)}
        </View>
      );
    }

    return (
      <View
        style={[
          styles.messageContainer,
          isMine && styles.messageContainerRight,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isMine ? styles.messageBubbleMine : styles.messageBubbleOther,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMine ? styles.messageTextMine : styles.messageTextOther,
            ]}
          >
            {item.content}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isMine ? styles.messageTimeMine : styles.messageTimeOther,
            ]}
          >
            {formatTime(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName}>{workerName || "Worker"}</Text>
          <Text style={styles.headerStatus}>{typing ? "Typing…" : "Chat"}</Text>
        </View>
      </View>

      {!!jobId && <NegotiationBanner jobId={jobId} role="customer" />}

      {loading && messages.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item._id || `${Math.random()}`}
          contentContainerStyle={styles.messagesList}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor={Colors.textSecondary}
          value={text}
          onChangeText={(t) => {
            setText(t);
            emitTyping();
          }}
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          <Ionicons
            name="send"
            size={20}
            color={text.trim() ? Colors.primary : Colors.border}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: { padding: 4, marginRight: 8 },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 16, fontWeight: "700", color: Colors.text },
  headerStatus: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  messagesList: { padding: 16, flexGrow: 1 },
  messageContainer: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
  },
  messageContainerRight: { justifyContent: "flex-end" },
  messageBubble: {
    maxWidth: "75%",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  messageBubbleMine: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: "white",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: { fontSize: 14, lineHeight: 20 },
  messageTextMine: { color: "white" },
  messageTextOther: { color: Colors.text },
  messageTime: { fontSize: 10, marginTop: 4 },
  messageTimeMine: { color: "rgba(255,255,255,0.7)", textAlign: "right" },
  messageTimeOther: { color: Colors.textSecondary },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 8,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightBackground,
    color: Colors.text,
    fontSize: 14,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  cartCard: {
    maxWidth: "85%",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: "white",
  },
  cartHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  cartTitle: { fontSize: 13, fontWeight: "700", color: Colors.text },
  cartRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 4,
    gap: 8,
  },
  cartItemName: { flex: 1, fontSize: 13, color: Colors.text },
  cartItemQty: { fontSize: 12, color: Colors.textSecondary, width: 30 },
  cartItemPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    minWidth: 70,
    textAlign: "right",
  },
  cartTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 8,
    marginTop: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cartTotalLabel: { fontSize: 13, fontWeight: "700", color: Colors.text },
  cartTotalValue: { fontSize: 14, fontWeight: "700", color: Colors.primary },
  cartActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  cartBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cartBtnApprove: {
    backgroundColor: Colors.primary,
  },
  cartBtnReject: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#C73E3A",
  },
  cartBtnApproveText: { color: "white", fontWeight: "700", fontSize: 13 },
  cartBtnRejectText: { color: "#C73E3A", fontWeight: "600", fontSize: 13 },
  cartStatusBadge: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: "italic",
  },
});
