import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";

interface Message {
  id: string;
  sender: "customer" | "worker";
  text: string;
  timestamp: string;
  image?: string;
  status?: "sending" | "sent" | "delivered" | "read";
}

const autoResponses = [
  "I'm on my way now!",
  "I'll be there in 5 minutes",
  "Could you send me a photo of the issue?",
  "I've brought the necessary tools",
  "This should take about 30 minutes to fix",
];

export default function CustomerChatPage() {
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "worker",
      text: "Hello! I have received your booking request.",
      timestamp: "10:30 AM",
      status: "read",
    },
    {
      id: "2",
      sender: "customer",
      text: "Great! What time can you arrive?",
      timestamp: "10:32 AM",
      status: "read",
    },
    {
      id: "3",
      sender: "worker",
      text: "I can be there in about 20 minutes",
      timestamp: "10:33 AM",
      status: "read",
    },
    {
      id: "4",
      sender: "customer",
      text: "Perfect! See you soon.",
      timestamp: "10:34 AM",
      status: "read",
    },
  ]);
  const [messageText, setMessageText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [workerOnline, setWorkerOnline] = useState(true);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      const newMessage: Message = {
        id: String(Date.now()),
        sender: "customer",
        text: messageText,
        timestamp: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
        status: "sending",
      };

      setMessages([...messages, newMessage]);
      setMessageText("");

      // Simulate message delivery
      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id ? { ...msg, status: "sent" } : msg,
          ),
        );
      }, 500);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id ? { ...msg, status: "delivered" } : msg,
          ),
        );
      }, 1000);

      setTimeout(() => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === newMessage.id ? { ...msg, status: "read" } : msg,
          ),
        );
      }, 1500);

      // Simulate worker typing and auto-response
      if (Math.random() > 0.3) {
        setTimeout(() => {
          setIsTyping(true);
        }, 2000);

        setTimeout(
          () => {
            setIsTyping(false);
            const response =
              autoResponses[Math.floor(Math.random() * autoResponses.length)];
            const workerMessage: Message = {
              id: String(Date.now()),
              sender: "worker",
              text: response,
              timestamp: new Date().toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              }),
              status: "read",
            };
            setMessages((prev) => [...prev, workerMessage]);
          },
          2000 + Math.random() * 2000,
        );
      }
    }
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Simulate worker online/offline status
  useEffect(() => {
    const interval = setInterval(() => {
      setWorkerOnline(Math.random() > 0.1); // 90% online
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageContainer,
        item.sender === "customer" && styles.messageContainerRight,
      ]}
    >
      {item.sender === "worker" && (
        <Image
          source={{ uri: "https://via.placeholder.com/30" }}
          style={styles.messageAvatar}
        />
      )}
      <View
        style={[
          styles.messageBubble,
          item.sender === "customer"
            ? styles.messageBubbleCustomer
            : styles.messageBubbleWorker,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            item.sender === "customer"
              ? styles.messageTextCustomer
              : styles.messageTextWorker,
          ]}
        >
          {item.text}
        </Text>
        <View style={styles.messageFooter}>
          <Text
            style={[
              styles.messageTime,
              item.sender === "customer"
                ? styles.messageTimeCustomer
                : styles.messageTimeWorker,
            ]}
          >
            {item.timestamp}
          </Text>
          {item.sender === "customer" && (
            <View style={styles.statusIcon}>
              {item.status === "sending" && (
                <ActivityIndicator size="small" color="rgba(255,255,255,0.7)" />
              )}
              {item.status === "sent" && (
                <Ionicons
                  name="checkmark"
                  size={12}
                  color="rgba(255,255,255,0.7)"
                />
              )}
              {item.status === "delivered" && (
                <Ionicons
                  name="checkmark-done"
                  size={12}
                  color="rgba(255,255,255,0.7)"
                />
              )}
              {item.status === "read" && (
                <Ionicons name="checkmark-done" size={12} color="#4FC3F7" />
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );

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
          <Text style={styles.headerName}>Ravi Kumar</Text>
          <View style={styles.statusRow}>
            <View
              style={[styles.onlineDot, !workerOnline && styles.offlineDot]}
            />
            <Text style={styles.headerStatus}>
              {workerOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.callButton}>
          <Ionicons name="call-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesList}
        scrollEnabled={true}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <View style={styles.typingContainer}>
          <Image
            source={{ uri: "https://via.placeholder.com/24" }}
            style={styles.typingAvatar}
          />
          <View style={styles.typingBubble}>
            <View style={styles.typingDots}>
              <View style={[styles.typingDot, { animationDelay: "0ms" }]} />
              <View style={[styles.typingDot, { animationDelay: "150ms" }]} />
              <View style={[styles.typingDot, { animationDelay: "300ms" }]} />
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="location-outline" size={18} color={Colors.primary} />
          <Text style={styles.quickActionText}>Location</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="time-outline" size={18} color={Colors.primary} />
          <Text style={styles.quickActionText}>ETA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.quickActionButton}>
          <Ionicons name="build-outline" size={18} color={Colors.primary} />
          <Text style={styles.quickActionText}>Parts</Text>
        </TouchableOpacity>
      </View>

      {/* Input Area */}
      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachButton}>
          <Ionicons name="image-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <TextInput
          style={styles.input}
          placeholder="Type your message..."
          placeholderTextColor={Colors.textSecondary}
          value={messageText}
          onChangeText={setMessageText}
          multiline
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={handleSendMessage}
          disabled={!messageText.trim()}
        >
          <Ionicons
            name="send"
            size={20}
            color={messageText.trim() ? Colors.primary : Colors.border}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4CAF50",
  },
  offlineDot: {
    backgroundColor: Colors.textSecondary,
  },
  headerStatus: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  callButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.lightBackground,
  },
  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 12,
    gap: 8,
  },
  messageContainerRight: {
    justifyContent: "flex-end",
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  messageBubble: {
    maxWidth: "80%",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  messageBubbleWorker: {
    backgroundColor: Colors.lightBackground,
    borderBottomLeftRadius: 4,
  },
  messageBubbleCustomer: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 13,
  },
  messageTextWorker: {
    color: Colors.text,
  },
  messageTextCustomer: {
    color: "white",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  messageTime: {
    fontSize: 10,
  },
  messageTimeWorker: {
    color: Colors.textSecondary,
  },
  messageTimeCustomer: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  statusIcon: {
    marginLeft: 2,
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  typingAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  typingBubble: {
    backgroundColor: Colors.lightBackground,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderBottomLeftRadius: 4,
  },
  typingDots: {
    flexDirection: "row",
    gap: 4,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.textSecondary,
  },
  quickActions: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.lightBackground,
    gap: 4,
  },
  quickActionText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  attachButton: {
    padding: 8,
    borderRadius: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: Colors.text,
    maxHeight: 100,
  },
  sendButton: {
    padding: 8,
    borderRadius: 8,
  },
});
