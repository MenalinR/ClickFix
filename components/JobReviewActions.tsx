import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
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

  const jobId = job._id || job.id;

  const runAction = async (action: Action) => {
    try {
      setLoadingAction(action);
      if (action === "approve") await onApprove(jobId);
      if (action === "negotiate") await onNegotiate(jobId);
      if (action === "deny") await onDeny(jobId);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to update job");
    } finally {
      setLoadingAction(null);
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
        onPress={() => runAction("negotiate")}
        disabled={loadingAction !== null}
      >
        {loadingAction === "negotiate" ? (
          <ActivityIndicator size="small" color={Colors.primary} />
        ) : (
          <>
            <Ionicons
              name="chatbubble-outline"
              size={16}
              color={Colors.primary}
            />
            <Text style={styles.negotiateText}>Negotiate</Text>
          </>
        )}
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
});
