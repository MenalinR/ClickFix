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
import { useStore } from "../constants/Store";

interface Props {
  jobId: string;
  role: "customer" | "worker";
}

export function NegotiationBanner({ jobId, role }: Props) {
  const {
    jobs,
    customerRespondToJob,
    finalizeJobPrice,
    workerCounterPrice,
  } = useStore();
  const [proposing, setProposing] = useState(false);
  const [proposed, setProposed] = useState("");
  const [loading, setLoading] = useState(false);

  const job: any = (jobs as any[]).find(
    (j) => (j._id || j.id) === jobId,
  );

  if (!job) return null;
  const status = job.status || "";
  if (status !== "Negotiating" && status !== "Worker Accepted") return null;

  const proposedPrice = job.pricing?.proposedPrice ?? 0;
  const negotiatedPrice = job.pricing?.negotiatedPrice ?? 0;
  const currentPrice = negotiatedPrice || proposedPrice;

  const handleProposeSubmit = async () => {
    const trimmed = proposed.trim();
    const priceNum = Number(trimmed);
    if (!trimmed || isNaN(priceNum) || priceNum <= 0) {
      Alert.alert("Invalid price", "Please enter a valid price.");
      return;
    }
    try {
      setLoading(true);
      if (role === "customer") {
        await customerRespondToJob(jobId, "negotiate", priceNum);
      } else {
        await workerCounterPrice(jobId, priceNum);
      }
      setProposing(false);
      setProposed("");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to send counter price");
    } finally {
      setLoading(false);
    }
  };

  const handleWorkerAcceptCurrent = () => {
    if (!currentPrice) {
      Alert.alert("No price", "No price has been proposed yet.");
      return;
    }
    Alert.alert(
      "Accept this price?",
      `Finalize the job at ${currentPrice} LKR?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Accept",
          onPress: async () => {
            try {
              setLoading(true);
              await finalizeJobPrice(jobId, currentPrice);
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to finalize price");
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.banner}>
      <View style={styles.row}>
        <Ionicons name="pricetag-outline" size={18} color={Colors.primary} />
        <Text style={styles.title}>
          {status === "Negotiating" ? "Negotiating" : "Awaiting customer"}
        </Text>
      </View>
      <View style={styles.priceRow}>
        <View style={styles.priceCell}>
          <Text style={styles.priceLabel}>Worker proposed</Text>
          <Text style={styles.priceValue}>{proposedPrice} LKR</Text>
        </View>
        {!!negotiatedPrice && (
          <View style={styles.priceCell}>
            <Text style={styles.priceLabel}>Customer counter</Text>
            <Text style={styles.priceValueAlt}>{negotiatedPrice} LKR</Text>
          </View>
        )}
      </View>
      {role === "customer" && (
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => setProposing(true)}
          disabled={loading}
        >
          <Text style={styles.primaryBtnText}>Propose new price</Text>
        </TouchableOpacity>
      )}
      {role === "worker" && status === "Negotiating" && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.primaryBtn, styles.actionBtn, styles.counterBtn]}
            onPress={() => setProposing(true)}
            disabled={loading}
          >
            <Text style={styles.counterBtnText}>Counter offer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryBtn, styles.actionBtn]}
            onPress={handleWorkerAcceptCurrent}
            disabled={loading || !currentPrice}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.primaryBtnText}>
                Accept {currentPrice} LKR
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={proposing}
        transparent
        animationType="fade"
        onRequestClose={() => setProposing(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>
              {role === "worker" ? "Send counter price" : "Propose new price"}
            </Text>
            <View style={styles.inputWrap}>
              <TextInput
                value={proposed}
                onChangeText={(t) => setProposed(t.replace(/[^0-9.]/g, ""))}
                placeholder="Your price"
                placeholderTextColor={Colors.textSecondary}
                keyboardType="numeric"
                style={styles.input}
              />
              <Text style={styles.currency}>LKR</Text>
            </View>
            <View style={styles.sheetActions}>
              <TouchableOpacity
                style={[styles.sheetBtn, styles.sheetCancel]}
                onPress={() => setProposing(false)}
                disabled={loading}
              >
                <Text style={styles.sheetCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sheetBtn, styles.sheetPrimary]}
                onPress={handleProposeSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.sheetPrimaryText}>Send</Text>
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
  banner: {
    backgroundColor: "#FFF8E1",
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
    padding: 12,
    marginHorizontal: 12,
    marginTop: 8,
    borderRadius: 8,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 6 },
  title: { fontSize: 13, fontWeight: "700", color: Colors.text },
  priceRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
    marginBottom: 10,
  },
  priceCell: { flex: 1 },
  priceLabel: { fontSize: 10, color: Colors.textSecondary },
  priceValue: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },
  priceValueAlt: {
    fontSize: 16,
    fontWeight: "700",
    color: "#F57F17",
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  primaryBtnText: { color: "white", fontWeight: "600", fontSize: 13 },
  actionRow: { flexDirection: "row", gap: 8 },
  actionBtn: { flex: 1 },
  counterBtn: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  counterBtnText: { color: Colors.primary, fontWeight: "600", fontSize: 13 },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  sheet: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 360,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 12,
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
  sheetActions: { flexDirection: "row", gap: 10 },
  sheetBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCancel: {
    backgroundColor: Colors.lightBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sheetCancelText: { color: Colors.text, fontWeight: "600" },
  sheetPrimary: { backgroundColor: Colors.primary },
  sheetPrimaryText: { color: "white", fontWeight: "600" },
});
