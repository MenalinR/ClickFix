import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";

interface Message {
  id: string;
  sender: "worker" | "customer";
  text: string;
  timestamp: string;
  type: "text" | "image";
  status?: "sending" | "sent" | "delivered" | "read";
}

const autoResponses = [
  "Okay, got it!",
  "Thanks for letting me know",
  "I understand, will do",
  "That would be helpful, thank you!",
  "Perfect timing!",
];

export default function ChatPage() {
  const router = useRouter();
  const { jobId, customerId } = useLocalSearchParams();
  const flatListRef = useRef<FlatList>(null);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      sender: "customer",
      text: "Hi, can you help fix my water pipe?",
      timestamp: "10:30 AM",
      type: "text",
      status: "read",
    },
    {
      id: "2",
      sender: "worker",
      text: "Yes, of course! I can come by this evening.",
      timestamp: "10:32 AM",
      type: "text",
      status: "read",
    },
    {
      id: "3",
      sender: "customer",
      text: "Great! What time would be good?",
      timestamp: "10:35 AM",
      type: "text",
      status: "read",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [customerOnline, setCustomerOnline] = useState(true);

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const newMessage: Message = {
        id: Date.now().toString(),
        sender: "worker",
        text: inputText,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: "text",
        status: "sending",
      };

      setMessages([...messages, newMessage]);
      setInputText("");

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

      // Simulate customer auto-response
      if (Math.random() > 0.3) {
        setTimeout(() => {
          setIsTyping(true);
        }, 2000);

        setTimeout(
          () => {
            setIsTyping(false);
            const response =
              autoResponses[Math.floor(Math.random() * autoResponses.length)];
            const customerMessage: Message = {
              id: Date.now().toString(),
              sender: "customer",
              text: response,
              timestamp: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              type: "text",
              status: "read",
            };
            setMessages((prev) => [...prev, customerMessage]);
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

  // Simulate customer online/offline status
  useEffect(() => {
    const interval = setInterval(() => {
      setCustomerOnline(Math.random() > 0.1);
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSendImage = () => {
    // TODO: Implement image picker
    const newMessage: Message = {
      id: Date.now().toString(),
      sender: "worker",
      text: "https://via.placeholder.com/150",
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "image",
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>Customer Name</Text>
            <View style={styles.statusRow}>
              <View
                style={[styles.onlineDot, !customerOnline && styles.offlineDot]}
              />
              <Text style={styles.jobTitle}>
                {customerOnline ? "Online" : "Offline"}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item: message }) => (
            <View
              key={message.id}
              style={[
                styles.messageWrapper,
                message.sender === "worker"
                  ? styles.workerMessageWrapper
                  : styles.customerMessageWrapper,
              ]}
            >
              {message.sender === "customer" && (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatar}>👤</Text>
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  message.sender === "worker"
                    ? styles.workerMessage
                    : styles.customerMessage,
                ]}
              >
                {message.type === "text" ? (
                  <Text
                    style={[
                      styles.messageText,
                      message.sender === "worker" && styles.workerMessageText,
                    ]}
                  >
                    {message.text}
                  </Text>
                ) : (
                  <Image
                    source={{ uri: message.text }}
                    style={styles.messageImage}
                  />
                )}
                <View style={styles.messageFooter}>
                  <Text
                    style={[
                      styles.timestamp,
                      message.sender === "worker" && styles.workerTimestamp,
                    ]}
                  >
                    {message.timestamp}
                  </Text>
                  {message.sender === "worker" && (
                    <View style={styles.statusIcon}>
                      {message.status === "sending" && (
                        <ActivityIndicator
                          size="small"
                          color="rgba(255,255,255,0.7)"
                        />
                      )}
                      {message.status === "sent" && (
                        <Ionicons
                          name="checkmark"
                          size={12}
                          color="rgba(255,255,255,0.7)"
                        />
                      )}
                      {message.status === "delivered" && (
                        <Ionicons
                          name="checkmark-done"
                          size={12}
                          color="rgba(255,255,255,0.7)"
                        />
                      )}
                      {message.status === "read" && (
                        <Ionicons
                          name="checkmark-done"
                          size={12}
                          color="#4FC3F7"
                        />
                      )}
                    </View>
                  )}
                </View>
              </View>
              {message.sender === "worker" && (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatar}>🔧</Text>
                </View>
              )}
            </View>
          )}
        />

        {/* Typing Indicator */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
                <View style={styles.typingDot} />
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionEmoji}>📍</Text>
              <Text style={styles.quickActionText}>Location</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionEmoji}>⏰</Text>
              <Text style={styles.quickActionText}>ETA</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionEmoji}>🛠️</Text>
              <Text style={styles.quickActionText}>Parts Needed</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickAction}>
              <Text style={styles.quickActionEmoji}>✅</Text>
              <Text style={styles.quickActionText}>Status</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Input Area */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.iconButton} onPress={handleSendImage}>
            <Ionicons name="image-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handleSendMessage}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? Colors.primary : Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
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
  customerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
  },
  jobTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
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
  callButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.lightBackground,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageWrapper: {
    flexDirection: "row",
    marginBottom: 12,
    alignItems: "flex-end",
    gap: 8,
  },
  workerMessageWrapper: {
    justifyContent: "flex-end",
  },
  customerMessageWrapper: {
    justifyContent: "flex-start",
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.lightBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: {
    fontSize: 18,
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
  },
  workerMessage: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  customerMessage: {
    backgroundColor: "white",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  messageText: {
    fontSize: 14,
    color: Colors.text,
  },
  workerMessageText: {
    color: "white",
  },
  messageImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "left",
  },
  workerTimestamp: {
    color: "rgba(255, 255, 255, 0.7)",
    textAlign: "right",
  },
  statusIcon: {
    marginLeft: 2,
  },
  typingContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  typingBubble: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignSelf: "flex-start",
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
  quickActionsContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingVertical: 8,
    backgroundColor: "white",
  },
  quickAction: {
    marginHorizontal: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
    alignItems: "center",
    gap: 4,
  },
  quickActionEmoji: {
    fontSize: 20,
  },
  quickActionText: {
    fontSize: 11,
    color: Colors.text,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: "white",
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.text,
    maxHeight: 100,
  },
  iconButton: {
    padding: 10,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
