import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";

export default function JobDetailsPage() {
  const router = useRouter();
  const { jobId } = useLocalSearchParams();
  const { jobs, updateJobStatus } = useStore();
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const job = jobs.find((j) => j.id === jobId);

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.heading}>Job not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const handleStatusChange = (
    newStatus: "Pending" | "Accepted" | "Rejected" | "Completed",
  ) => {
    updateJobStatus(job.id, newStatus);
    setStatusModalVisible(false);
    Alert.alert("Success", `Job status updated to ${newStatus}`);
  };

  const handleRequestParts = () => {
    router.push({
      pathname: "/hardware-request",
      params: { jobId: job.id },
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
          <Text style={styles.heading}>Job Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Job Status */}
        <View
          style={[
            styles.statusContainer,
            {
              backgroundColor:
                job.status === "Completed"
                  ? "#E8F5E9"
                  : job.status === "Accepted"
                    ? "#E3F2FD"
                    : "#F5F5F5",
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  job.status === "Completed"
                    ? "#4CAF50"
                    : job.status === "Accepted"
                      ? "#2196F3"
                      : "#999",
              },
            ]}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.statusLabel}>Current Status</Text>
            <Text style={styles.statusValue}>{job.status}</Text>
          </View>
          <TouchableOpacity
            style={styles.changeStatusButton}
            onPress={() => setStatusModalVisible(true)}
          >
            <Ionicons name="create-outline" size={18} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Customer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons
                name="person-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.infoLabel}>Name</Text>
              <Text style={styles.infoValue}>{job.customerName}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="call-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoLabel}>Contact</Text>
              <Text style={styles.infoValue}>+94 70 XXX XXXX</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="star-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoLabel}>Rating</Text>
              <Text style={styles.infoValue}>4.5 ⭐</Text>
            </View>
          </View>
        </View>

        {/* Job Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Job Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons
                name="hammer-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.infoLabel}>Service Type</Text>
              <Text style={styles.infoValue}>{job.serviceType}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons
                name="location-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoValue}>{job.location}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons
                name="calendar-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.infoLabel}>Date & Time</Text>
              <Text style={styles.infoValue}>{job.requestedDate}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <Text style={styles.infoLabel}>Estimated Duration</Text>
              <Text style={styles.infoValue}>{job.estimatedDuration}</Text>
            </View>
          </View>
        </View>

        {/* Problem Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Problem Description</Text>
          <View style={styles.descriptionCard}>
            <Text style={styles.descriptionText}>{job.description}</Text>
          </View>
        </View>

        {/* Images */}
        {job.images && job.images.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos & Videos</Text>
            <View style={styles.imagesGrid}>
              {job.images.map((image, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.imageContainer}
                  onPress={() => setSelectedImage(image)}
                >
                  <Image source={{ uri: image }} style={styles.gridImage} />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="expand-outline" size={20} color="white" />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Price */}
        <View style={styles.section}>
          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>Estimated Price</Text>
            <Text style={styles.priceValue}>{job.price} LKR</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.section}>
          {job.status === "Accepted" && (
            <>
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={() => {
                  Alert.alert("Success", "Job marked as Started");
                }}
              >
                <Ionicons name="play-circle-outline" size={20} color="white" />
                <Text style={styles.primaryButtonText}>Start Job</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: "#FF9800", marginTop: 10 },
                ]}
                onPress={handleRequestParts}
              >
                <Ionicons name="build-outline" size={20} color="white" />
                <Text style={styles.primaryButtonText}>
                  Request Hardware Parts
                </Text>
              </TouchableOpacity>
            </>
          )}

          {job.status === "Accepted" && (
            <TouchableOpacity
              style={[
                styles.primaryButton,
                { backgroundColor: "#4CAF50", marginTop: 10 },
              ]}
              onPress={() => {
                updateJobStatus(job.id, "Completed");
                Alert.alert("Success", "Job marked as Completed");
              }}
            >
              <Ionicons
                name="checkmark-circle-outline"
                size={20}
                color="white"
              />
              <Text style={styles.primaryButtonText}>Mark as Completed</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.primaryButton,
              { backgroundColor: "#2196F3", marginTop: 10 },
            ]}
            onPress={() =>
              router.push({
                pathname: "/chat",
                params: { jobId: job.id, customerId: job.customerId },
              })
            }
          >
            <Ionicons name="chatbubble-outline" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Chat with Customer</Text>
          </TouchableOpacity>
        </View>

        {/* Status Modal */}
        <Modal
          visible={statusModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setStatusModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Job Status</Text>
                <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                  <Ionicons
                    name="close-outline"
                    size={24}
                    color={Colors.text}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.statusOptions}>
                {(["Accepted", "Completed"] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      job.status === status && styles.statusOptionActive,
                    ]}
                    onPress={() => handleStatusChange(status)}
                  >
                    <Text
                      style={[
                        styles.statusOptionText,
                        job.status === status && styles.statusOptionTextActive,
                      ]}
                    >
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
        </Modal>

        {/* Image Modal */}
        <Modal
          visible={!!selectedImage}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedImage(null)}
        >
          <View style={styles.fullImageContainer}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close-outline" size={28} color="white" />
            </TouchableOpacity>
            {selectedImage && (
              <Image source={{ uri: selectedImage }} style={styles.fullImage} />
            )}
          </View>
        </Modal>
      </ScrollView>
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
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    gap: 12,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  statusValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: 2,
  },
  changeStatusButton: {
    padding: 8,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
    flex: 1,
    textAlign: "right",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  descriptionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  imagesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  imageContainer: {
    width: "48%",
    aspectRatio: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: Colors.lightBackground,
  },
  gridImage: {
    width: "100%",
    height: "100%",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  priceCard: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  priceLabel: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 6,
  },
  priceValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
  },
  statusOptions: {
    gap: 10,
  },
  statusOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.lightBackground,
    borderWidth: 2,
    borderColor: "transparent",
  },
  statusOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  statusOptionText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: "500",
    textAlign: "center",
  },
  statusOptionTextActive: {
    color: "white",
  },
  fullImageContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
  },
  fullImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
});
