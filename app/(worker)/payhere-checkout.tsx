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

        const html = buildPayhereHtml({
          merchantId,
          orderId: `HW-${orderId}`,
          amount: amountFormatted,
          currency,
          hash,
          firstName,
          lastName,
          email,
          phone,
          items: itemsSummary,
          shopName,
        });
        setHtmlContent(html);
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

    if (url.includes(RETURN_URL) || url.includes("/payment/return")) {
      didNavigate.current = true;
      Alert.alert("Payment Successful", "Your hardware order has been paid!", [
        { text: "OK", onPress: () => router.replace("/(worker)/hardware-updates") },
      ]);
    } else if (url.includes(CANCEL_URL) || url.includes("/payment/cancel")) {
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
          source={{ html: htmlContent, baseUrl: SANDBOX_URL }}
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

function buildPayhereHtml(p: {
  merchantId: string;
  orderId: string;
  amount: string;
  currency: string;
  hash: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  items: string;
  shopName: string;
}) {
  const notifyUrl = `${api.payments.payhereNotify}`;
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 20px; font-family: sans-serif; background: #f5f5f5; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: white; border-radius: 16px; padding: 24px; width: 100%; max-width: 400px; box-shadow: 0 2px 12px rgba(0,0,0,0.08); text-align: center; }
    .logo { color: #0F4C75; font-size: 22px; font-weight: bold; margin-bottom: 4px; }
    .shop { color: #666; font-size: 14px; margin-bottom: 16px; }
    .amount { font-size: 32px; font-weight: bold; color: #0F4C75; margin-bottom: 8px; }
    .currency { font-size: 16px; color: #888; margin-bottom: 20px; }
    .items { background: #f8f9fa; border-radius: 8px; padding: 12px; font-size: 13px; color: #444; margin-bottom: 20px; text-align: left; }
    .btn { background: #0F4C75; color: white; border: none; border-radius: 10px; padding: 16px 32px; font-size: 16px; font-weight: bold; cursor: pointer; width: 100%; }
    .secure { color: #888; font-size: 11px; margin-top: 12px; }
  </style>
</head>
<body>
<div class="card">
  <div class="logo">ClickFix</div>
  <div class="shop">Payment for ${escapeHtml(p.shopName)}</div>
  <div class="amount">${p.amount}</div>
  <div class="currency">${p.currency}</div>
  <div class="items">${escapeHtml(p.items)}</div>
  <form method="post" action="${SANDBOX_URL}" id="payhere-form">
    <input type="hidden" name="merchant_id" value="${p.merchantId}" />
    <input type="hidden" name="return_url" value="${RETURN_URL}" />
    <input type="hidden" name="cancel_url" value="${CANCEL_URL}" />
    <input type="hidden" name="notify_url" value="${notifyUrl}" />
    <input type="hidden" name="order_id" value="${p.orderId}" />
    <input type="hidden" name="items" value="${escapeHtml(p.items)}" />
    <input type="hidden" name="currency" value="${p.currency}" />
    <input type="hidden" name="amount" value="${p.amount}" />
    <input type="hidden" name="first_name" value="${escapeHtml(p.firstName)}" />
    <input type="hidden" name="last_name" value="${escapeHtml(p.lastName)}" />
    <input type="hidden" name="email" value="${p.email}" />
    <input type="hidden" name="phone" value="${p.phone}" />
    <input type="hidden" name="address" value="Sri Lanka" />
    <input type="hidden" name="city" value="Colombo" />
    <input type="hidden" name="country" value="Sri Lanka" />
    <input type="hidden" name="hash" value="${p.hash}" />
    <button type="submit" class="btn">Proceed to Pay</button>
  </form>
  <div class="secure">Secured by PayHere · SSL Encrypted</div>
</div>
</body>
</html>`;
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
