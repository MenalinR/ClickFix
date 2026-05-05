import { NegotiationBanner } from "@/components/NegotiationBanner";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
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

type DraftItem = { name: string; quantity: string };

export default function WorkerChatPage() {
  const router = useRouter();
  const { token } = useStore();
  const params = useLocalSearchParams<{
    jobId?: string;
    customerId?: string;
    customerName?: string;
  }>();
  const jobId = typeof params.jobId === "string" ? params.jobId : "";
  const customerId =
    typeof params.customerId === "string" ? params.customerId : "";
  const initialName =
    typeof params.customerName === "string" ? params.customerName : "";
  const flatListRef = useRef<FlatList>(null);
  const [text, setText] = useState("");
  const [customerName, setCustomerName] = useState(initialName);
  const [cartModalOpen, setCartModalOpen] = useState(false);
  const [draftItems, setDraftItems] = useState<DraftItem[]>([
    { name: "", quantity: "1" },
  ]);

  useEffect(() => {
    if (customerName || !customerId || !token) return;
    (async () => {
      try {
        const res = await apiCall(
          api.customers.getById(customerId),
          "GET",
          undefined,
          token,
        );
        const name = res?.data?.name || res?.name;
        if (name) setCustomerName(name);
      } catch {
        // silent
      }
    })();
  }, [customerName, customerId, token]);

  const {
    messages,
    loading,
    sending,
    typing,
    sendMessage,
    sendHardwareCart,
    emitTyping,
    myId,
  } = useChat({ jobId, otherUserId: customerId, otherUserModel: "Customer" });

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

  const updateDraftItem = (
    index: number,
    field: keyof DraftItem,
    value: string,
  ) => {
    setDraftItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, [field]: value } : it)),
    );
  };

  const addDraftRow = () =>
    setDraftItems((prev) => [...prev, { name: "", quantity: "1" }]);

  const removeDraftRow = (index: number) =>
    setDraftItems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
    );

  const resetDraft = () => {
    setDraftItems([{ name: "", quantity: "1" }]);
    setCartModalOpen(false);
  };

  const handleSendCart = async () => {
    const cleaned = draftItems
      .map((it) => ({
        name: it.name.trim(),
        quantity: Number(it.quantity) || 1,
      }))
      .filter((it) => it.name);

    if (cleaned.length === 0) {
      Alert.alert("Add items", "Add at least one item name.");
      return;
    }

    await sendHardwareCart(cleaned);
    resetDraft();
  };

  const renderCartBubble = (item: any, isMine: boolean) => {
    const items = (item.cartItems || []) as any[];
    const status = item.cartStatus || "pending";
    return (
      <View
        style={[
          styles.cartCard,
          isMine ? styles.cartCardMine : styles.cartCardOther,
        ]}
      >
        <View style={styles.cartHeader}>
          <Ionicons name="cube-outline" size={16} color={Colors.primary} />
          <Text style={styles.cartTitle}>Hardware Suggestion</Text>
        </View>
        {items.map((it, idx) => (
          <View key={idx} style={styles.cartRow}>
            <Text style={styles.cartItemName} numberOfLines={1}>
              • {it.name}
            </Text>
            <Text style={styles.cartItemQty}>×{it.quantity || 1}</Text>
          </View>
        ))}
        <Text
          style={[
            styles.cartStatusBadge,
            status === "approved" && { color: "#22A06B" },
            status === "ordered" && { color: "#22A06B" },
            status === "rejected" && { color: "#C73E3A" },
          ]}
        >
          {status === "pending"
            ? "Awaiting customer approval"
            : status === "approved"
              ? "✓ Approved — final price set when you order from a shop"
              : status === "ordered"
                ? "✓ Ordered from a shop"
                : "✗ Declined by customer"}
        </Text>
        {status === "approved" && isMine && jobId && (
          <TouchableOpacity
            style={styles.orderShopBtn}
            onPress={() =>
              router.push({
                pathname: "/(worker)/order-hardware",
                params: { jobId, customerId },
              })
            }
          >
            <Ionicons name="storefront-outline" size={16} color="white" />
            <Text style={styles.orderShopBtnText}>Order from Shop</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMine =
      String(item.senderId?._id || item.senderId) === String(myId) ||
      item.senderModel === "Worker";

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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{customerName || "Customer"}</Text>
            <Text style={styles.headerStatus}>
              {typing ? "Typing…" : "Chat"}
            </Text>
          </View>
        </View>

        {!!jobId && <NegotiationBanner jobId={jobId} role="worker" />}

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
          <TouchableOpacity
            style={styles.cartButton}
            onPress={() => setCartModalOpen(true)}
            disabled={sending}
          >
            <Ionicons name="cube-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
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
      </KeyboardAvoidingView>

      <Modal
        visible={cartModalOpen}
        transparent
        animationType="slide"
        onRequestClose={resetDraft}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Suggest Hardware</Text>
              <TouchableOpacity onPress={resetDraft}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle}>
              List the parts needed. The customer approves the list — final
              prices come from the hardware shop you order from.
            </Text>

            <ScrollView style={{ maxHeight: 360 }}>
              {draftItems.map((item, idx) => (
                <View key={idx} style={styles.draftRow}>
                  <TextInput
                    style={[styles.draftInput, { flex: 3 }]}
                    placeholder="Item name (e.g. PVC pipe)"
                    placeholderTextColor={Colors.textSecondary}
                    value={item.name}
                    onChangeText={(v) => updateDraftItem(idx, "name", v)}
                  />
                  <TextInput
                    style={[styles.draftInput, { width: 56 }]}
                    placeholder="Qty"
                    placeholderTextColor={Colors.textSecondary}
                    keyboardType="numeric"
                    value={item.quantity}
                    onChangeText={(v) => updateDraftItem(idx, "quantity", v)}
                  />
                  <TouchableOpacity
                    onPress={() => removeDraftRow(idx)}
                    style={styles.removeBtn}
                    disabled={draftItems.length === 1}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={draftItems.length === 1 ? Colors.border : "#C73E3A"}
                    />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity onPress={addDraftRow} style={styles.addRowBtn}>
              <Ionicons name="add" size={18} color={Colors.primary} />
              <Text style={styles.addRowText}>Add another item</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sendCartBtn, sending && { opacity: 0.6 }]}
              onPress={handleSendCart}
              disabled={sending}
            >
              {sending ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.sendCartBtnText}>Send to Customer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  cartButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.lightBackground,
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
    borderColor: Colors.border,
    backgroundColor: "white",
  },
  cartCardMine: {
    borderColor: Colors.primary,
    backgroundColor: "#F0F4F8",
  },
  cartCardOther: {
    borderColor: Colors.border,
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
  cartStatusBadge: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 8,
    fontStyle: "italic",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  modalCard: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: 16,
  },
  draftRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  draftInput: {
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.text,
  },
  removeBtn: { padding: 6 },
  addRowBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    marginTop: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    borderStyle: "dashed",
  },
  addRowText: { color: Colors.primary, fontWeight: "600", fontSize: 13 },
  totalLine: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 14,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  totalLineLabel: { fontSize: 14, fontWeight: "600", color: Colors.text },
  totalLineValue: { fontSize: 16, fontWeight: "700", color: Colors.primary },
  sendCartBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 4,
  },
  sendCartBtnText: { color: "white", fontWeight: "700", fontSize: 14 },
  orderShopBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  orderShopBtnText: { color: "white", fontWeight: "600", fontSize: 13 },
});
