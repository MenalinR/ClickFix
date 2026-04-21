import { useCallback, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { api, apiCall } from "../constants/api";
import { config } from "../constants/config";
import { useStore } from "../constants/Store";

export interface ChatSummary {
  chatId: string;
  lastMessage: any;
  otherUser: any;
  job: any;
  unreadCount: number;
}

const socketBaseURL = () => {
  const base = config.api.baseURL || "";
  return base.replace(/\/api\/?$/, "");
};

export function useChatList(pollInterval = 15000) {
  const { token, user, isLoggedIn } = useStore();
  const [chats, setChats] = useState<ChatSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const myId = (user as any)?._id || (user as any)?.id;

  const fetchChats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiCall(api.chat.getChats, "GET", undefined, token);
      setChats((res?.data || []) as ChatSummary[]);
    } catch (e) {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!isLoggedIn || !token) return;
    fetchChats();
    const id = setInterval(fetchChats, pollInterval);
    return () => clearInterval(id);
  }, [isLoggedIn, token, pollInterval, fetchChats]);

  // Live refresh when a message arrives in any chat the user is part of.
  useEffect(() => {
    if (!isLoggedIn || !token || !myId) return;
    const socket: Socket = io(socketBaseURL(), {
      transports: ["websocket"],
    });
    socket.emit("join-chat", String(myId));
    socket.on("receive-message", () => {
      fetchChats();
    });
    return () => {
      socket.disconnect();
    };
  }, [isLoggedIn, token, myId, fetchChats]);

  const totalUnread = chats.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return { chats, loading, totalUnread, refresh: fetchChats };
}
