import Constants from "expo-constants";
import { Platform } from "react-native";

// Environment detection
const ENV = process.env.NODE_ENV || "development";
const IS_DEV = ENV === "development";

/**
 * Get the local IP address from environment or use fallback
 * For mobile device testing:
 * - Run: ipconfig | grep "inet " (on Mac)
 * - Add to .env: EXPO_PUBLIC_LOCAL_IP=192.168.1.6
 */
const getLocalIP = (): string => {
  const hostUri =
    (Constants.expoConfig as any)?.hostUri ||
    (Constants as any)?.manifest2?.extra?.expoClient?.hostUri;
  const expoHostIP = hostUri?.split(":")?.[0];
  if (expoHostIP) return expoHostIP;

  const envIP = process.env.EXPO_PUBLIC_LOCAL_IP;
  if (envIP) return envIP;

  // Fallback IPs for common scenarios
  if (Platform.OS === "web") return "localhost";
  if (Platform.OS === "android") return "10.0.2.2";
  return "127.0.0.1";
};

const LOCAL_IP = getLocalIP();
const API_PORT = process.env.EXPO_PUBLIC_API_PORT || "5001";

/**
 * API Configuration
 * Supports multiple environments:
 * - Development (local): Uses LOCAL_IP:5001
 * - Staging: Define in .env
 * - Production: Define in .env
 */
export const config = {
  // Environment
  env: ENV,
  isDev: IS_DEV,

  // API URLs
  api: {
    baseURL:
      process.env.EXPO_PUBLIC_API_URL || `http://${LOCAL_IP}:${API_PORT}/api`,

    // For reference/debugging
    debug: {
      localIP: LOCAL_IP,
      port: API_PORT,
      fullURL: process.env.EXPO_PUBLIC_API_URL || `http://${LOCAL_IP}:${API_PORT}/api`,
    },
  },

  // Database
  database: {
    name: "clickfix",
  },

  // Feature flags
  features: {
    enableLogging: IS_DEV,
    enableMockData: false,
  },

  // Timeout settings
  timeouts: {
    apiCall: 30000, // 30 seconds
    connection: 10000, // 10 seconds
  },
};

// Log configuration on app start (dev only)
if (IS_DEV) {
  console.log("🔧 App Configuration:", {
    environment: ENV,
    apiBaseURL: config.api.baseURL,
    localIP: LOCAL_IP,
  });
}
