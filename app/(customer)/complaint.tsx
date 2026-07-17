import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, apiCall } from "../../constants/api";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";

const CATEGORIES = [
  "Unprofessional Behavior",
  "No Show",
  "Property Damage",
  "Overcharging",
  "Fraud",
  "Poor Quality Work",
  "Other",
];

export default function ComplaintScreen() {
  const router = useRouter();
  const { token } = useStore();
  const params = useLocalSearchParams();

  const workerId = params.workerId as string;
  const workerName = (params.workerName as string) || "Worker";
  const jobId = params.jobId as string | undefined;
  const serviceType = (params.serviceType as string) || "";

  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!category) {
      Alert.alert("Category required", "Please select a complaint category.");
      return;
    }
    if (description.trim().length < 10) {
      Alert.alert("Description required", "Please describe the issue (at least 10 characters).");
      return;
    }
    if (!workerId || !token) {
      Alert.alert("Error", "Missing information. Please try again.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await apiCall(
        api.complaints.create,
        "POST",
        {
          workerId,
          jobId: jobId || undefined,
          category,
          description: description.trim(),
        },
        token,
      );

      if (!res?.success) {
        Alert.alert("Error", res?.message || "Could not submit complaint.");
        return;
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.back();
      }, 2000);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not submit complaint.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.heading}>Report Worker</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Worker Info */}
        <View style={styles.infoCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={24} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.workerName}>{workerName}</Text>
            {!!serviceType && <Text style={styles.serviceType}>{serviceType}</Text>}
          </View>
        </View>

        <View style={styles.warningBanner}>
          <Ionicons name="information-circle-outline" size={16} color="#856404" />
          <Text style={styles.warningText}>
            Complaints are reviewed by admin. False reports may affect your account.
          </Text>
        </View>

        {/* Category */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>What is your complaint about?</Text>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryRow, category === cat && styles.categoryRowActive]}
              onPress={() => setCategory(cat)}
            >
              <View style={[styles.radioCircle, category === cat && styles.radioCircleActive]}>
                {category === cat && <View style={styles.radioDot} />}
              </View>
              <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Describe the issue</Text>
          <Text style={styles.subtitle}>Provide as much detail as possible</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Explain what happened..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={5}
            value={description}
            onChangeText={setDescription}
            maxLength={1000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{description.length}/1000</Text>
        </View>
      </ScrollView>

      {/* Submit */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (!category || submitting) && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={!category || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitText}>Submit Complaint</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            <Text style={styles.successTitle}>Complaint Submitted</Text>
            <Text style={styles.successMsg}>
              Our admin team will review your complaint and take appropriate action.
            </Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 100 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: { padding: 8 },
  heading: { fontSize: 22, fontWeight: "700", color: Colors.text },
  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.lightBackground,
    alignItems: "center",
    justifyContent: "center",
  },
  workerName: { fontSize: 16, fontWeight: "700", color: Colors.text },
  serviceType: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  warningBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FFF9C4",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#F9A825",
  },
  warningText: { flex: 1, fontSize: 12, color: "#856404", lineHeight: 18 },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.text, marginBottom: 12 },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginBottom: 10 },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 6,
    backgroundColor: Colors.lightBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryRowActive: {
    backgroundColor: Colors.primary + "15",
    borderColor: Colors.primary,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  radioCircleActive: { borderColor: Colors.primary },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  categoryText: { fontSize: 14, color: Colors.text },
  categoryTextActive: { fontWeight: "600", color: Colors.primary },
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.text,
    minHeight: 110,
    marginBottom: 6,
  },
  charCount: { fontSize: 11, color: Colors.textSecondary, textAlign: "right" },
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
  submitBtn: {
    backgroundColor: "#C62828",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitText: { color: "white", fontSize: 16, fontWeight: "700" },
  successOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successBox: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 32,
    alignItems: "center",
    width: "80%",
  },
  successTitle: { fontSize: 20, fontWeight: "700", color: Colors.text, marginTop: 12 },
  successMsg: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
    lineHeight: 20,
  },
});
