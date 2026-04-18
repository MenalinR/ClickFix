import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Colors } from "../constants/Colors";

type Action = "approve" | "negotiate" | "deny";

interface Props {
  job: any;
  onApprove: (jobId: string) => Promise<void>;
  onNegotiate: (jobId: string, counterPrice?: number) => Promise<void>;
  onDeny: (jobId: string) => Promise<void>;
  compact?: boolean;
}

export function JobReviewActions({
  job,
  onApprove,
  onNegotiate,
  onDeny,
  compact,
}: Props) {
  const [loadingAction, setLoadingAction] = useState<Action | null>(null);
  const [negotiateOpen, setNegotiateOpen] = useState(false);
  const [counterPrice, setCounterPrice] = useState("");

  const jobId = job._id || job.id;
  const proposedPrice =
    job.pricing?.proposedPrice ??
    job.pricing?.totalAmount ??
    job.pricing?.serviceCharge ??
    0;

  const runAction = async (action: Action, price?: number) => {
    try {
      setLoadingAction(action);
      if (action === "approve") await onApprove(jobId);
      if (action === "negotiate") await onNegotiate(jobId, price);
      if (action === "deny") await onDeny(jobId);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update job");
    } finally {
      setLoadingAction(null);
      setNegotiateOpen(false);
      setCounterPrice("");
    }
  };

  const handleDenyPress = () => {
    Alert.alert(
      "Deny job?",
      "The worker will be notified and this job will be closed.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Deny",
          style: "destructive",
          onPress: () => runAction("deny"),
        },
      ],
    );
  };

  const handleNegotiateSubmit = () => {
    const trimmed = counterPrice.trim();
    const priceNum = Number(trimmed);
    if (!trimmed || isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Invalid price", "Please enter a valid counter price.");
      return;
    }
    runAction("negotiate", priceNum);
  };

  return (
    <View style={compact ? styles.rowCompact : styles.row}>
      <TouchableOpacity
        style={[styles.btn, styles.deny]}
        onPress={handleDenyPress}
        disabled={loadingAction !== null}
      >
        {loadingAction === "deny" ? (
          <ActivityIndicator size="small" color="#C62828" />
        ) : (
          <>
            <Ionicons name="close-circle-outline" size={16} color="#C62828" />
            <Text style={styles.denyText}>Deny</Text>
          </>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, styles.negotiate]}
        onPress={() => setNegotiateOpen(true)}
        disabled={loadingAction !== null}
      >
        <Ionicons name="chatbubble-outline" size={16} color={Colors.primary} />
        <Text style={styles.negotiateText}>Negotiate</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.btn, styles.approve]}
        onPress={() => runAction("approve")}
        disabled={loadingAction !== null}
      >
        {loadingAction === "approve" ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Ionicons name="checkmark-circle-outline" size={16} color="white" />
            <Text style={styles.approveText}>Approve</Text>
          </>
        )}
      </TouchableOpacity>

      <Modal
        visible={negotiateOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setNegotiateOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Propose a counter price</Text>
            <Text style={styles.modalSubtitle}>
              Worker proposed {proposedPrice} LKR. Enter your counter offer.
            </Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={counterPrice}
                onChangeText={(t) =>
                  setCounterPrice(t.replace(/[^0-9.]/g, ""))
                }
                placeholder="Your price"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                style={styles.input}
              />
              <Text style={styles.currency}>LKR</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalCancel]}
                onPress={() => setNegotiateOpen(false)}
                disabled={loadingAction === "negotiate"}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.modalPrimary]}
                onPress={handleNegotiateSubmit}
                disabled={loadingAction === "negotiate"}
              >
                {loadingAction === "negotiate" ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalPrimaryText}>Send & open chat</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", gap: 8, marginTop: 12 },
  rowCompact: { flexDirection: "row", gap: 6, marginTop: 8 },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
  },
  deny: { backgroundColor: "#FFEBEE", borderWidth: 1, borderColor: "#EF9A9A" },
  denyText: { color: "#C62828", fontWeight: "600", fontSize: 12 },
  negotiate: {
    backgroundColor: Colors.lightBackground,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  negotiateText: { color: Colors.primary, fontWeight: "600", fontSize: 12 },
  approve: { backgroundColor: Colors.primary },
  approveText: { color: "white", fontWeight: "600", fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
  },
  currency: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
  },
  modalActions: { flexDirection: "row", gap: 10 },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancel: {
    backgroundColor: Colors.lightBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: { color: Colors.text, fontWeight: "600" },
  modalPrimary: { backgroundColor: Colors.primary },
  modalPrimaryText: { color: "white", fontWeight: "600" },
});
