import { useEffect, useState } from "react";
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

const POLL_INTERVAL = 15000;

let subscribers = 0;
let pollTimer: ReturnType<typeof setInterval> | null = null;
let socket: Socket | null = null;
let currentToken: string | null = null;
let currentUserId: string | null = null;

let chatsState: ChatSummary[] = [];
let loadingState = true;
const listeners = new Set<() => void>();

const notify = () => listeners.forEach((l) => l());

const fetchChats = async () => {
  if (!currentToken) return;
  try {
    const res = await apiCall(api.chat.getChats, "GET", undefined, currentToken);
    chatsState = (res?.data || []) as ChatSummary[];
  } catch {
    // silent
  } finally {
    loadingState = false;
    notify();
  }
};

const startSession = (token: string, userId: string) => {
  currentToken = token;
  currentUserId = userId;
  fetchChats();
  pollTimer = setInterval(fetchChats, POLL_INTERVAL);
  socket = io(socketBaseURL(), { transports: ["websocket"] });
  socket.emit("join-chat", String(userId));
  socket.on("receive-message", fetchChats);
};

const stopSession = () => {
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = null;
  socket?.disconnect();
  socket = null;
  currentToken = null;
  currentUserId = null;
  chatsState = [];
  loadingState = true;
};

export function useChatList() {
  const { token, user, isLoggedIn } = useStore();
  const myId = (user as any)?._id || (user as any)?.id;
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isLoggedIn || !token || !myId) return;

    const listener = () => setTick((t) => t + 1);
    listeners.add(listener);

    const tokenChanged = currentToken !== token || currentUserId !== String(myId);
    if (subscribers === 0 || tokenChanged) {
      if (tokenChanged && subscribers > 0) stopSession();
      startSession(token, String(myId));
    }
    subscribers += 1;

    return () => {
      listeners.delete(listener);
      subscribers -= 1;
      if (subscribers === 0) stopSession();
    };
  }, [isLoggedIn, token, myId]);

  const totalUnread = chatsState.reduce(
    (sum, c) => sum + (c.unreadCount || 0),
    0,
  );

  return {
    chats: chatsState,
    loading: loadingState,
    totalUnread,
    refresh: fetchChats,
  };
}
