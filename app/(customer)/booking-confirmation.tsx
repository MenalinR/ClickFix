import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
    Alert,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";

export default function BookingConfirmationPage() {
  const router = useRouter();
  const { workers } = useStore();
  const params = useLocalSearchParams();
  const workerId = params.workerId as string;
  const worker = workers.find((w) => w.id === workerId);

  if (!worker) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Worker not found</Text>
      </SafeAreaView>
    );
  }

  const estimatedCost = Math.round(worker.hourlyRate * 2);

  const handleConfirmBooking = () => {
    Alert.alert("Success", "Booking confirmed! Worker will accept shortly.");
    router.push({
      pathname: "/job-tracking",
      params: { jobId: "job_123", workerId },
    });
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
          <Text style={styles.heading}>Confirm Booking</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Booking Summary */}
        <Text style={styles.sectionTitle}>Booking Summary</Text>

        {/* Service Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Details</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Service Type</Text>
            <Text style={styles.value}>{params.serviceType}</Text>
          </View>
          <View style={[styles.summaryRow, styles.divider]}>
            <Text style={styles.label}>Urgency</Text>
            <Text
              style={[
                styles.value,
                params.urgency === "Urgent" && { color: "#FF6B6B" },
              ]}
            >
              {params.urgency || "Normal"}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.label}>Date & Time</Text>
            <Text style={styles.value}>
              {params.date} {params.time}
            </Text>
          </View>
        </View>

        {/* Worker Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Assigned Professional</Text>
          <View style={styles.workerInfo}>
            <Image source={{ uri: worker.image }} style={styles.workerImage} />
            <View style={{ flex: 1 }}>
              <Text style={styles.workerName}>{worker.name}</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={14} color="#FFB800" />
                <Text style={styles.ratingText}>{worker.rating} ⭐</Text>
              </View>
              <Text style={styles.workerCategory}>
                {worker.category} • {worker.location}
              </Text>
            </View>
          </View>
          <View style={styles.workerStats}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {worker.reviews?.length || 120}
              </Text>
              <Text style={styles.statLabel}>Reviews</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>8+</Text>
              <Text style={styles.statLabel}>Years Exp</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>✓</Text>
              <Text style={styles.statLabel}>Verified</Text>
            </View>
          </View>
        </View>

        {/* Cost Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Cost Breakdown</Text>
          <View style={styles.costRow}>
            <Text style={styles.label}>Service Charge</Text>
            <Text style={styles.value}>{estimatedCost} LKR</Text>
          </View>
          <View style={[styles.costRow, styles.divider]}>
            <Text style={styles.label}>Platform Fee</Text>
            <Text style={styles.value}>0 LKR</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.label}>Hardware (if needed)</Text>
            <Text style={styles.value}>To be confirmed</Text>
          </View>
          <View style={[styles.costRow, styles.totalCost]}>
            <Text style={styles.totalLabel}>Estimated Total</Text>
            <Text style={styles.totalValue}>{estimatedCost} LKR</Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Service Location</Text>
          <View style={styles.locationBox}>
            <Ionicons name="location" size={20} color={Colors.primary} />
            <Text style={styles.locationText}>
              456, Main Street, Colombo 03
            </Text>
          </View>
        </View>

        {/* Terms & Conditions */}
        <View style={styles.termsBox}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={Colors.primary}
          />
          <Text style={styles.termsText}>
            By confirming, you agree to our Terms & Conditions. You'll be able
            to chat with the worker and make changes before they arrive.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
        >
          <Text style={styles.cancelButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirmBooking}
        >
          <Ionicons name="checkmark" size={20} color="white" />
          <Text style={styles.confirmButtonText}>Confirm Booking</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  workerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  workerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  workerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  workerCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  workerStats: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  costRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
  },
  totalCost: {
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.primary,
  },
  locationBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
    padding: 12,
  },
  locationText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
  },
  termsBox: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#E3F2FD",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#90CAF9",
    marginBottom: 20,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: "#1565C0",
    lineHeight: 16,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: "row",
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: "center",
  },
  cancelButtonText: {
    color: Colors.text,
    fontWeight: "600",
    fontSize: 14,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 14,
  },
});
