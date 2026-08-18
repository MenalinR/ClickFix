import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import WebView from "react-native-webview";
import { api, apiCall } from "../../constants/api";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";

const SANDBOX_URL = "https://sandbox.payhere.lk/pay/checkout";
const RETURN_URL = "https://clickfix-backend.onrender.com/api/payments/payment/return";
const CANCEL_URL = "https://clickfix-backend.onrender.com/api/payments/payment/cancel";
const NOTIFY_URL = "https://clickfix-backend.onrender.com/api/payments/payhere/notify";
// baseUrl must match a domain registered in your PayHere sandbox integration settings
const BASE_URL = "http://localhost";

function esc(v: string) {
  return v.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

function buildPayhereHtml(fields: Record<string, string>): string {
  const inputs = Object.entries(fields)
    .map(([k, v]) => `<input type="hidden" name="${esc(k)}" value="${esc(v)}">`)
    .join("\n");
  return `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>
<form id="f" method="POST" action="${SANDBOX_URL}">${inputs}</form>
<script>document.getElementById('f').submit();</script>
</body></html>`;
}

export default function PayhereCheckoutScreen() {
  const router = useRouter();
  const { token, user } = useStore();
  const params = useLocalSearchParams<{
    orderId?: string;
    amount?: string;
    shopName?: string;
    itemsSummary?: string;
  }>();

  const orderId = typeof params.orderId === "string" ? params.orderId : "";
  const amount = typeof params.amount === "string" ? params.amount : "0";
  const shopName =
    typeof params.shopName === "string" ? params.shopName : "Hardware Shop";
  const itemsSummary =
    typeof params.itemsSummary === "string"
      ? params.itemsSummary
      : "Hardware items";

  const [loading, setLoading] = useState(true);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [webViewLoading, setWebViewLoading] = useState(true);
  const didNavigate = useRef(false);

  useEffect(() => {
    if (!orderId || !amount || !token) return;
    (async () => {
      try {
        const res = await apiCall(
          api.payments.payhereHash,
          "POST",
          { orderId: `HW-${orderId}`, amount, currency: "LKR" },
          token,
        );
        if (!res.success || !res.data?.hash) {
          Alert.alert("Error", "Could not initialize payment. Try again.");
          router.back();
          return;
        }

        const { hash, merchantId, amountFormatted, currency } = res.data;
        const firstName = (user?.name || "Worker").split(" ")[0];
        const lastName = (user?.name || "").split(" ").slice(1).join(" ") || "User";
        const email = user?.email || "worker@clickfix.app";
        const phone = user?.phone || "0771234567";

        setHtmlContent(buildPayhereHtml({
          merchant_id: merchantId,
          return_url: RETURN_URL,
          cancel_url: CANCEL_URL,
          notify_url: NOTIFY_URL,
          order_id: `HW-${orderId}`,
          items: itemsSummary,
          currency,
          amount: amountFormatted,
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          address: "Sri Lanka",
          city: "Colombo",
          country: "Sri Lanka",
          hash,
        }));
      } catch (e: any) {
        Alert.alert("Error", e?.message || "Failed to initialize payment");
        router.back();
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId, amount, token]);

  const handleNavigationChange = (navState: { url: string }) => {
    if (didNavigate.current) return;
    const url = navState.url || "";

    if (url.includes("/payment/return")) {
      didNavigate.current = true;
      Alert.alert("Payment Successful", "Your hardware order has been paid!", [
        { text: "OK", onPress: () => router.replace("/(worker)/hardware-updates") },
      ]);
    } else if (url.includes("/payment/cancel")) {
      didNavigate.current = true;
      Alert.alert("Payment Cancelled", "Payment was cancelled.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Initializing payment...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Pay via PayHere</Text>
          <Text style={styles.headerSub}>
            {shopName} · {parseFloat(amount).toFixed(2)} LKR
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {webViewLoading && (
        <View style={styles.webViewLoader}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading payment page...</Text>
        </View>
      )}

      {htmlContent && (
        <WebView
          source={{ html: htmlContent, baseUrl: BASE_URL }}
          style={[styles.webView, webViewLoading && { opacity: 0 }]}
          onLoadEnd={() => setWebViewLoading(false)}
          onNavigationStateChange={handleNavigationChange}
          javaScriptEnabled
          domStorageEnabled
          startInLoadingState={false}
          mixedContentMode="compatibility"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { padding: 4, width: 40 },
  headerInfo: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 16, fontWeight: "700", color: Colors.text },
  headerSub: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 14, color: Colors.textSecondary },
  webViewLoader: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    backgroundColor: Colors.background,
    zIndex: 10,
  },
  webView: { flex: 1 },
});
