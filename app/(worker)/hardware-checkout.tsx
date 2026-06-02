import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, apiCall } from "../../constants/api";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";

interface CartLine {
  hardwareItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  unit?: string;
}

export default function HardwareCheckoutPage() {
  const router = useRouter();
  const { token } = useStore();
  const params = useLocalSearchParams<{
    jobId?: string;
    customerId?: string;
    shopId?: string;
    shopName?: string;
    shopAddress?: string;
    cart?: string;
  }>();

  const jobId = typeof params.jobId === "string" ? params.jobId : "";
  const customerId =
    typeof params.customerId === "string" ? params.customerId : "";
  const shopId = typeof params.shopId === "string" ? params.shopId : "";
  const shopName = typeof params.shopName === "string" ? params.shopName : "";
  const shopAddress =
    typeof params.shopAddress === "string" ? params.shopAddress : "";

  const cartLines = useMemo<CartLine[]>(() => {
    try {
      const raw = typeof params.cart === "string" ? params.cart : "[]";
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
    } catch {
      return [];
    }
  }, [params.cart]);

  const cartTotal = useMemo(
    () =>
      cartLines.reduce((sum, l) => sum + (l.price || 0) * (l.quantity || 1), 0),
    [cartLines],
  );

  const [submitting, setSubmitting] = useState(false);

  const handlePlaceOrder = async () => {
    if (!shopId || cartLines.length === 0) return;
    setSubmitting(true);
    try {
      const res = await apiCall(
        api.hardware.createOrderFromJob,
        "POST",
        {
          jobId,
          shopId,
          items: cartLines.map((l) => ({
            hardwareItemId: l.hardwareItemId,
            quantity: l.quantity,
          })),
        },
        token,
      );
      const total = res?.data?.request?.totalCost || cartTotal;
      const itemCount = cartLines.length;

      if (customerId) {
        try {
          await apiCall(
            api.chat.sendMessage,
            "POST",
            {
              chatId: jobId,
              receiverId: customerId,
              receiverModel: "Customer",
              jobId,
              messageType: "text",
              content: `Hardware ordered — ${itemCount} item${
                itemCount > 1 ? "s" : ""
              }, ${total} LKR added to your bill.`,
            },
            token,
          );
        } catch {
          // non-fatal
        }
      }

      Alert.alert("Order placed", `Total ${total} LKR added to the bill.`, [
        {
          text: "OK",
          onPress: () => router.replace("/(worker)"),
        },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to create order");
    } finally {
      setSubmitting(false);
    }
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
        <Text style={styles.headerTitle}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sectionTitle}>Shop</Text>
        <View style={styles.shopCard}>
          <View style={styles.shopIcon}>
            <Ionicons
              name="storefront-outline"
              size={22}
              color={Colors.primary}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.shopName}>{shopName}</Text>
            {!!shopAddress && (
              <Text style={styles.shopMeta} numberOfLines={1}>
                {shopAddress}
              </Text>
            )}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>
          Order Summary
        </Text>
        {cartLines.map((line) => (
          <View key={line.hardwareItemId} style={styles.itemRow}>
            <View style={styles.itemImageWrap}>
              {line.image ? (
                <Image
                  source={{ uri: line.image }}
                  style={styles.itemImage}
                  resizeMode="cover"
                />
              ) : (
                <Ionicons
                  name="cube-outline"
                  size={26}
                  color={Colors.textSecondary}
                />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName} numberOfLines={1}>
                {line.name}
              </Text>
              <Text style={styles.itemMeta}>
                {line.price} LKR{line.unit ? ` / ${line.unit}` : ""} × {line.quantity}
              </Text>
            </View>
            <Text style={styles.itemLineTotal}>
              {line.price * line.quantity} LKR
            </Text>
          </View>
        ))}

        <View style={styles.totalsCard}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal</Text>
            <Text style={styles.totalValue}>{cartTotal} LKR</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabelBold}>Total</Text>
            <Text style={styles.totalValueBold}>{cartTotal} LKR</Text>
          </View>
        </View>

        <Text style={styles.note}>
          The total will be added to the customer's bill once the order is
          placed.
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.footerTop}>
          <Text style={styles.footerLabel}>Total</Text>
          <Text style={styles.footerTotal}>{cartTotal} LKR</Text>
        </View>
        <TouchableOpacity
          style={[styles.placeBtn, submitting && { opacity: 0.6 }]}
          onPress={handlePlaceOrder}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.placeBtnText}>Place Order</Text>
          )}
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: { padding: 4, width: 40 },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    textAlign: "center",
  },
  content: { padding: 16, paddingBottom: 160 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
  },
  shopCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  shopIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.lightBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  shopName: { fontSize: 14, fontWeight: "700", color: Colors.text },
  shopMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  itemImageWrap: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: Colors.lightBackground,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  itemImage: { width: 52, height: 52 },
  itemName: { fontSize: 14, fontWeight: "600", color: Colors.text },
  itemMeta: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  itemLineTotal: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  totalsCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  totalLabel: { fontSize: 13, color: Colors.textSecondary },
  totalValue: { fontSize: 14, color: Colors.text, fontWeight: "600" },
  totalLabelBold: { fontSize: 15, fontWeight: "700", color: Colors.text },
  totalValueBold: { fontSize: 18, fontWeight: "700", color: Colors.primary },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  note: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: "italic",
    marginTop: 12,
    textAlign: "center",
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  footerLabel: { fontSize: 13, color: Colors.textSecondary },
  footerTotal: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.primary,
  },
  placeBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  placeBtnText: { color: "white", fontSize: 15, fontWeight: "700" },
});
