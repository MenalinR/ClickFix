import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { api, apiCall } from "../constants/api";
import { config } from "../constants/config";
import { useStore } from "../constants/Store";

export interface ChatMessage {
  _id: string;
  chatId: string;
  senderId: any;
  senderModel: "Worker" | "Customer";
  receiverId: any;
  receiverModel: "Worker" | "Customer";
  jobId?: string;
  messageType: "text" | "image" | "location" | "quick-action";
  content: string;
  status: "sending" | "sent" | "delivered" | "read";
  createdAt: string;
  updatedAt: string;
}

interface UseChatOptions {
  jobId?: string;
  otherUserId?: string;
  otherUserModel: "Worker" | "Customer";
}

const socketBaseURL = () => {
  const base = config.api.baseURL || "";
  return base.replace(/\/api\/?$/, "");
};

export function useChat({
  jobId,
  otherUserId,
  otherUserModel,
}: UseChatOptions) {
  const { token, user } = useStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const chatId = jobId || "";

  const myId = (user as any)?._id || (user as any)?.id;

  const fetchMessages = useCallback(async () => {
    if (!chatId || !token) return;
    try {
      setLoading(true);
      const res = await apiCall(api.chat.getMessages(chatId), "GET", undefined, token);
      setMessages((res?.data || []) as ChatMessage[]);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  }, [chatId, token]);

  const markAsRead = useCallback(async () => {
    if (!chatId || !token) return;
    try {
      await apiCall(api.chat.markChatAsRead(chatId), "PUT", {}, token);
    } catch (e) {
      // silent
    }
  }, [chatId, token]);

  useEffect(() => {
    if (!chatId || !token) return;
    fetchMessages();
    markAsRead();

    const socket = io(socketBaseURL(), { transports: ["websocket"] });
    socketRef.current = socket;
    socket.emit("join-chat", chatId);

    socket.on("receive-message", (msg: ChatMessage) => {
      // Only append messages from the OTHER user — ours are added on send
      if (String((msg as any).senderId?._id || msg.senderId) !== String(myId)) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
        markAsRead();
      }
    });

    socket.on("user-typing", (data: any) => {
      if (String(data?.senderId) !== String(myId)) {
        setTyping(true);
        setTimeout(() => setTyping(false), 2000);
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [chatId, token, myId, fetchMessages, markAsRead]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || !chatId || !token || !otherUserId) return;
      setSending(true);
      try {
        const res = await apiCall(
          api.chat.sendMessage,
          "POST",
          {
            chatId,
            receiverId: otherUserId,
            receiverModel: otherUserModel,
            jobId,
            messageType: "text",
            content: content.trim(),
          },
          token,
        );
        if (res?.data) {
          const saved = res.data as ChatMessage;
          setMessages((prev) => [...prev, saved]);
          socketRef.current?.emit("send-message", { ...saved, chatId });
        }
      } catch (e) {
        // TODO show error
      } finally {
        setSending(false);
      }
    },
    [chatId, token, otherUserId, otherUserModel, jobId],
  );

  const emitTyping = useCallback(() => {
    if (!chatId) return;
    socketRef.current?.emit("typing", { chatId, senderId: myId });
  }, [chatId, myId]);

  return { messages, loading, sending, typing, sendMessage, emitTyping, myId };
}
