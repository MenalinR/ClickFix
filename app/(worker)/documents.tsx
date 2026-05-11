import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useStore } from "@/constants/Store";
import { api, apiCall, apiUpload } from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

type DocumentStatus = "Pending" | "Verified" | "Rejected";

export default function DocumentsScreen() {
  const { user, token } = useStore();
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);

  // ID Proof form
  const [idDocumentType, setIdDocumentType] = useState("NIC");
  const [idDocumentUrl, setIdDocumentUrl] = useState("");
  const [idUploading, setIdUploading] = useState(false);
  const [idTypeModalVisible, setIdTypeModalVisible] = useState(false);

  useEffect(() => {
    if (user?._id) {
      fetchVerificationStatus();
    }
  }, [user?._id]);

  const fetchVerificationStatus = async () => {
    if (!user?._id) {
      console.error("User ID not available");
      return;
    }

    try {
      setLoading(true);
      const response = await apiCall(
        api.workers.getVerificationStatus(user._id),
        "GET",
        undefined,
        token!,
      );
      setVerificationStatus(response?.data || {});
    } catch (error) {
      console.error("Error fetching verification status:", error);
    } finally {
      setLoading(false);
    }
  };

  const pickFromGallery = async (setUrl: (url: string) => void) => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission needed",
          "Allow access to your photos to pick an image.",
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
      });
      if (!result.canceled && result.assets?.[0]) {
        setUrl(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const pickPdf = async (setUrl: (url: string) => void) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
      });
      if (!result.canceled && result.assets[0]) {
        setUrl(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Failed to select document");
    }
  };

  const handleUploadIDProof = async () => {
    if (!user?._id) {
      Alert.alert("Error", "User information not loaded. Please try again.");
      return;
    }

    if (!idDocumentUrl.trim()) {
      Alert.alert("Error", "Please select a document");
      return;
    }

    try {
      setIdUploading(true);

      const formData = new FormData();

      const filename = idDocumentUrl.split("/").pop() || "document.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const extension = match ? match[1] : "jpg";

      let mimeType = "image/jpeg";
      if (extension === "pdf") {
        mimeType = "application/pdf";
      } else if (extension === "png") {
        mimeType = "image/png";
      } else if (extension === "jpg" || extension === "jpeg") {
        mimeType = "image/jpeg";
      }

      formData.append("document", {
        uri: idDocumentUrl,
        name: filename,
        type: mimeType,
      } as any);

      formData.append("documentType", idDocumentType);

      console.log("📤 Uploading ID proof:", { filename, type: mimeType });

      await apiUpload(
        api.workers.uploadIDProof(user._id),
        formData,
        token!,
      );

      Alert.alert("Success", "ID proof uploaded successfully!");
      setIdDocumentUrl("");
      fetchVerificationStatus();
    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setIdUploading(false);
    }
  };

  const getStatusColor = (status: DocumentStatus) => {
    switch (status) {
      case "Verified":
        return "#10B981";
      case "Rejected":
        return "#EF4444";
      case "Pending":
        return "#F59E0B";
      default:
        return "#6B7280";
    }
  };

  const getStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case "Verified":
        return "checkmark-circle";
      case "Rejected":
        return "close-circle";
      case "Pending":
        return "time";
      default:
        return "help-circle";
    }
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#0066CC" />
      </ThemedView>
    );
  }

  const idProof = verificationStatus?.idProof;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.innerContainer}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Documents</ThemedText>
          <ThemedText style={styles.subtitle}>
            Upload your ID proof for verification.
          </ThemedText>
        </View>

        {/* Overall Verification Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons
              name={
                verificationStatus?.isFullyVerified
                  ? "checkmark-circle"
                  : "alert-circle"
              }
              size={24}
              color={
                verificationStatus?.isFullyVerified ? "#10B981" : "#F59E0B"
              }
            />
            <ThemedText style={styles.statusTitle}>
              {verificationStatus?.isFullyVerified
                ? "Fully Verified"
                : "Verification In Progress"}
            </ThemedText>
          </View>
          <ThemedText style={styles.statusText}>
            {verificationStatus?.isFullyVerified
              ? "All documents verified. You can now accept bookings!"
              : "Complete your verification to unlock all features"}
          </ThemedText>
        </View>

        {/* ID PROOF SECTION */}
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>ID Proof</ThemedText>

          {idProof && idProof.url ? (
            <View style={styles.documentCard}>
              <View style={styles.documentHeader}>
                <View style={styles.documentInfo}>
                  <ThemedText style={styles.documentName}>
                    {idProof.documentType} Proof
                  </ThemedText>
                  <ThemedText style={styles.documentDate}>
                    {new Date(idProof.uploadedAt).toLocaleDateString()}
                  </ThemedText>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: getStatusColor(
                        idProof.verificationStatus,
                      ),
                    },
                  ]}
                >
                  <Ionicons
                    name={getStatusIcon(idProof.verificationStatus)}
                    size={16}
                    color="white"
                  />
                  <ThemedText style={styles.statusBadgeText}>
                    {idProof.verificationStatus}
                  </ThemedText>
                </View>
              </View>

              {idProof.verificationNotes && (
                <View style={styles.notesContainer}>
                  <ThemedText style={styles.notesLabel}>
                    Admin Notes:
                  </ThemedText>
                  <ThemedText style={styles.notes}>
                    {idProof.verificationNotes}
                  </ThemedText>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="document" size={48} color="#9CA3AF" />
              <ThemedText style={styles.emptyText}>
                No ID proof uploaded yet
              </ThemedText>
            </View>
          )}

          <View style={styles.formSection}>
            <ThemedText style={styles.label}>Document Type</ThemedText>
            <TouchableOpacity
              style={styles.dropdown}
              onPress={() => setIdTypeModalVisible(true)}
            >
              <ThemedText style={styles.dropdownText}>
                {idDocumentType}
              </ThemedText>
              <Ionicons name="chevron-down" size={20} color="#0066CC" />
            </TouchableOpacity>

            <Modal
              transparent
              visible={idTypeModalVisible}
              onRequestClose={() => setIdTypeModalVisible(false)}
            >
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setIdTypeModalVisible(false)}
              >
                <View style={styles.modalContent}>
                  <ThemedText style={styles.modalTitle}>
                    Select Document Type
                  </ThemedText>
                  {["NIC", "Passport", "DrivingLicense", "Other"].map(
                    (type) => (
                      <TouchableOpacity
                        key={type}
                        style={styles.modalOption}
                        onPress={() => {
                          setIdDocumentType(type);
                          setIdTypeModalVisible(false);
                        }}
                      >
                        <Ionicons
                          name={
                            idDocumentType === type
                              ? "radio-button-on"
                              : "radio-button-off"
                          }
                          size={20}
                          color="#0066CC"
                        />
                        <ThemedText style={styles.modalOptionText}>
                          {type}
                        </ThemedText>
                      </TouchableOpacity>
                    ),
                  )}
                </View>
              </TouchableOpacity>
            </Modal>

            <View style={styles.idPickerWrap}>
              <TouchableOpacity
                style={styles.idPickerBox}
                onPress={() => {
                  Alert.alert("Select file", "Choose a source", [
                    {
                      text: "Choose from Photos",
                      onPress: () => pickFromGallery(setIdDocumentUrl),
                    },
                    {
                      text: "Pick PDF / File",
                      onPress: () => pickPdf(setIdDocumentUrl),
                    },
                    { text: "Cancel", style: "cancel" },
                  ]);
                }}
              >
                <View style={styles.idPickerIconWrap}>
                  <Ionicons name="document-outline" size={36} color="#0F4C75" />
                  <View style={styles.idPickerPlus}>
                    <Ionicons name="add" size={14} color="white" />
                  </View>
                </View>
                <ThemedText style={styles.idPickerLabel}>
                  Select a file
                </ThemedText>
              </TouchableOpacity>

              <ThemedText style={styles.idPickerHelper}>
                Support JPG, PNG, PDF, WAV, MP3, MOV and TXT
              </ThemedText>
              <ThemedText style={styles.idPickerHelper}>
                Maximum size 20MB per file. Up to 10 files at a time.
              </ThemedText>

              {!!idDocumentUrl && (
                <View style={styles.idPickerSelected}>
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color="#22A06B"
                  />
                  <ThemedText style={styles.idPickerSelectedText}>
                    File selected
                  </ThemedText>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.idUploadBtn,
                idDocumentUrl && !idUploading && styles.idUploadBtnReady,
              ]}
              onPress={handleUploadIDProof}
              disabled={!idDocumentUrl || idUploading}
            >
              {idUploading ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText style={styles.idUploadBtnText}>
                  Upload document
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* SECURITY INFO */}
        <View style={styles.securityInfo}>
          <Ionicons name="shield-checkmark" size={20} color="#0066CC" />
          <ThemedText style={styles.securityText}>
            Your documents are securely stored and verified by our team within
            24-48 hours.
          </ThemedText>
        </View>
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  innerContainer: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  statusCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: "#F59E0B",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 12,
  },
  statusText: {
    fontSize: 13,
    opacity: 0.7,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 16,
  },
  documentCard: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  documentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  documentDate: {
    fontSize: 12,
    opacity: 0.6,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "600",
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#EF4444",
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 4,
    color: "#DC2626",
  },
  notes: {
    fontSize: 12,
    color: "#991B1B",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    opacity: 0.5,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
  },
  formSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1F2937",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    maxHeight: "70%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
    gap: 12,
  },
  modalOptionText: {
    fontSize: 14,
    fontWeight: "500",
    flex: 1,
  },
  securityInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    padding: 12,
    gap: 12,
    marginTop: 24,
  },
  securityText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  idPickerWrap: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  idPickerBox: {
    borderWidth: 1.5,
    borderColor: "#0F4C75",
    borderStyle: "dashed",
    borderRadius: 10,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  idPickerIconWrap: {
    position: "relative",
    marginBottom: 8,
  },
  idPickerPlus: {
    position: "absolute",
    right: -6,
    bottom: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#0F4C75",
    alignItems: "center",
    justifyContent: "center",
  },
  idPickerLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
    textDecorationLine: "underline",
  },
  idPickerHelper: {
    fontSize: 11,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 4,
  },
  idPickerSelected: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  idPickerSelectedText: {
    fontSize: 13,
    color: "#22A06B",
    fontWeight: "600",
  },
  idUploadBtn: {
    backgroundColor: "#A7C5DD",
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  idUploadBtnReady: {
    backgroundColor: "#0F4C75",
  },
  idUploadBtnText: {
    color: "white",
    fontSize: 15,
    fontWeight: "700",
  },
});
