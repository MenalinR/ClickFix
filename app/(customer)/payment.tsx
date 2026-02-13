import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";

type PaymentMethod = "card" | "wallet" | "cash";

export default function PaymentPage() {
  const router = useRouter();
  const { workerName, amount } = useLocalSearchParams();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>("card");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const serviceCost = 3000;
  const hardwareCost = 650;
  const platformFee = 300;
  const totalAmount = serviceCost + hardwareCost + platformFee;

  const paymentMethods = [
    {
      id: "card",
      name: "Credit/Debit Card",
      icon: "card-outline",
      description: "Visa, Mastercard",
      balance: "Available",
    },
    {
      id: "wallet",
      name: "ClickFix Wallet",
      icon: "wallet-outline",
      description: "2,500 LKR available",
      balance: "Low balance",
    },
    {
      id: "cash",
      name: "Cash on Site",
      icon: "cash-outline",
      description: "Pay directly to professional",
      balance: "Available",
    },
  ];

  const handlePayment = () => {
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
      router.push("./(tabs)");
    }, 2000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.heading}>Payment</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Cost Breakdown Card */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Cost Breakdown</Text>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Service (2 hours)</Text>
            <Text style={styles.costValue}>3,000 LKR</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Hardware Items</Text>
            <Text style={styles.costValue}>650 LKR</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Platform Fee</Text>
            <Text style={styles.costValue}>300 LKR</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.costRow}>
            <Text style={styles.totalLabel}>Total Amount</Text>
            <Text style={styles.totalValue}>{totalAmount} LKR</Text>
          </View>
        </View>

        {/* Payment Method Selection */}
        <Text style={styles.sectionTitle}>Select Payment Method</Text>
        {paymentMethods.map((method) => (
          <TouchableOpacity
            key={method.id}
            onPress={() => setSelectedMethod(method.id as PaymentMethod)}
            style={[
              styles.paymentMethodCard,
              selectedMethod === method.id && styles.paymentMethodCardSelected,
            ]}
          >
            <View style={styles.methodIconContainer}>
              <Ionicons
                name={method.icon as any}
                size={24}
                color={
                  selectedMethod === method.id
                    ? Colors.primary
                    : Colors.textSecondary
                }
              />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>{method.name}</Text>
              <Text style={styles.methodDescription}>{method.description}</Text>
            </View>
            <View
              style={[
                styles.radioButton,
                selectedMethod === method.id && styles.radioButtonSelected,
              ]}
            >
              {selectedMethod === method.id && (
                <View style={styles.radioButtonInner} />
              )}
            </View>
          </TouchableOpacity>
        ))}

        {/* Card Details (if card selected) */}
        {selectedMethod === "card" && (
          <View style={styles.cardDetailsContainer}>
            <Text style={styles.sectionTitle}>Card Details</Text>
            <View style={styles.card}>
              <View style={styles.cardInputGroup}>
                <Text style={styles.label}>Card Number</Text>
                <Text style={styles.inputValue}>**** **** **** 4242</Text>
              </View>
              <View style={styles.cardInputRow}>
                <View style={[styles.cardInputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>Expiry</Text>
                  <Text style={styles.inputValue}>12/25</Text>
                </View>
                <View
                  style={[styles.cardInputGroup, { flex: 1, marginLeft: 12 }]}
                >
                  <Text style={styles.label}>CVV</Text>
                  <Text style={styles.inputValue}>***</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Wallet Balance (if wallet selected) */}
        {selectedMethod === "wallet" && (
          <View style={styles.walletContainer}>
            <Text style={styles.sectionTitle}>Wallet Balance</Text>
            <View style={styles.card}>
              <View style={styles.balanceCard}>
                <Ionicons
                  name="wallet-outline"
                  size={40}
                  color={Colors.primary}
                />
                <Text style={styles.balanceAmount}>2,500 LKR</Text>
                <Text style={styles.balanceLabel}>Available Balance</Text>
              </View>
              <Text style={styles.warningText}>
                ⚠️ Insufficient balance. You need {totalAmount - 2500} LKR more.
              </Text>
              <TouchableOpacity style={styles.addMoneyButton}>
                <Ionicons
                  name="add-circle-outline"
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.addMoneyText}>Add Money</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Terms & Conditions */}
        <View style={styles.termsCard}>
          <View style={styles.checkboxContainer}>
            <View style={styles.checkbox}>
              <Ionicons name="checkmark" size={14} color="white" />
            </View>
            <Text style={styles.termsText}>
              I agree to the terms and conditions
            </Text>
          </View>
        </View>

        {/* Secure Payment Badge */}
        <View style={styles.secureContainer}>
          <Ionicons
            name="shield-checkmark-outline"
            size={16}
            color={Colors.primary}
          />
          <Text style={styles.secureText}>
            Secured by industry-standard encryption
          </Text>
        </View>
      </ScrollView>

      {/* Pay Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.payButton,
            selectedMethod === "wallet" && { opacity: 0.6 },
          ]}
          onPress={handlePayment}
          disabled={selectedMethod === "wallet"}
        >
          <Text style={styles.payButtonText}>Pay {totalAmount} LKR</Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.successModalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIcon}>
              <Ionicons
                name="checkmark-circle"
                size={60}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.successTitle}>Payment Successful!</Text>
            <Text style={styles.successMessage}>
              Your booking has been confirmed with{" "}
              {workerName || "the professional"}.
            </Text>
            <Text style={styles.successSubmessage}>
              Redirecting to your bookings...
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 80,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 12,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  costLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  costValue: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.primary,
  },
  paymentMethodCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paymentMethodCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: "#F0F4F8",
  },
  methodIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: Colors.lightBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  methodInfo: {
    flex: 1,
  },
  methodName: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  radioButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  radioButtonInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "white",
    alignSelf: "center",
    marginTop: 5,
  },
  cardDetailsContainer: {
    marginBottom: 16,
  },
  cardInputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
    fontWeight: "600",
  },
  inputValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "600",
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
  },
  cardInputRow: {
    flexDirection: "row",
  },
  walletContainer: {
    marginBottom: 16,
  },
  balanceCard: {
    alignItems: "center",
    paddingVertical: 20,
    backgroundColor: Colors.lightBackground,
    borderRadius: 12,
    marginBottom: 12,
  },
  balanceAmount: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary,
    marginTop: 8,
  },
  balanceLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  warningText: {
    fontSize: 12,
    color: "#FF6B6B",
    marginBottom: 12,
    textAlign: "center",
  },
  addMoneyButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 6,
  },
  addMoneyText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
  },
  termsCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
    fontWeight: "500",
  },
  secureContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    marginBottom: 20,
  },
  secureText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "500",
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
  payButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  payButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModal: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    width: "80%",
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 10,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 13,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  successSubmessage: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
