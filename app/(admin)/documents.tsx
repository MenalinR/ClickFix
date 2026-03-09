import { Button } from "@/components/Button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useStore } from "@/constants/Store";
import { api, apiCall } from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    FlatList,
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface PendingDocument {
  workerId: string;
  workerName: string;
  workerEmail: string;
  workerPhone: string;
  category: string;
  documentType: string;
  document: {
    _id?: string;
    url: string;
    name?: string;
    documentType?: string;
    issueDate?: string;
    expiryDate?: string;
  };
  uploadedAt: string;
}

export default function DocumentVerificationScreen() {
  const { token } = useStore();
  const [loading, setLoading] = useState(false);
  const [pendingDocuments, setPendingDocuments] = useState<PendingDocument[]>(
    [],
  );
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<{
    [key: string]: string;
  }>({});
  const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set());
  const [notificationsMarked, setNotificationsMarked] = useState(false);

  useEffect(() => {
    fetchPendingDocuments();
    // Mark all document notifications as read when page opens
    markAllDocumentNotificationsAsRead();
  }, []);

  const markAllDocumentNotificationsAsRead = async () => {
    try {
      // Get all notifications
      const notificationsResponse = await apiCall(
        api.notifications.getAll,
        "GET",
        undefined,
        token!,
      );

      // Find all unread document upload notifications
      const unreadDocNotifications =
        notificationsResponse.data?.filter(
          (notif: any) => notif.type === "DOCUMENT_UPLOADED" && !notif.read,
        ) || [];

      console.log(
        `📋 Found ${unreadDocNotifications.length} unread document notifications`,
      );

      // Mark each as read
      for (const notif of unreadDocNotifications) {
        try {
          await apiCall(
            api.notifications.markAsRead(notif._id),
            "PUT",
            undefined,
            token!,
          );
          console.log(`✅ Marked notification ${notif._id} as read`);
        } catch (err) {
          console.error(`❌ Failed to mark notification ${notif._id}:`, err);
        }
      }

      if (unreadDocNotifications.length > 0) {
        console.log(
          `✅ Successfully marked ${unreadDocNotifications.length} notifications as read`,
        );
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  };

  const fetchPendingDocuments = async () => {
    try {
      setLoading(true);
      const response = await apiCall(
        api.admin.getPendingDocuments,
        "GET",
        undefined,
        token!,
      );
      setPendingDocuments(response.data || []);
    } catch (error) {
      console.error("Error fetching pending documents:", error);
      Alert.alert("Error", "Failed to load pending documents");
    } finally {
      setLoading(false);
    }
  };

  const markRelatedNotificationsAsRead = async (workerId: string) => {
    try {
      // Get all notifications to find the ones related to this worker
      const notificationsResponse = await apiCall(
        api.notifications.getAll,
        "GET",
        undefined,
        token!,
      );

      // Find ALL notifications related to this worker (not just one)
      const relatedNotifications =
        notificationsResponse.data?.filter(
          (notif: any) =>
            notif.type === "DOCUMENT_UPLOADED" &&
            notif.data?.workerId === workerId &&
            !notif.read,
        ) || [];

      // Mark all of them as read
      for (const notif of relatedNotifications) {
        await apiCall(
          api.notifications.markAsRead(notif._id),
          "PUT",
          undefined,
          token!,
        );
      }

      if (relatedNotifications.length > 0) {
        console.log(
          `✅ Marked ${relatedNotifications.length} notifications as read for worker ${workerId}`,
        );
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
      // Don't show error to user, this is a background operation
    }
  };
  const openDocument = async (url: string) => {
    if (!url) {
      Alert.alert("Error", "Document URL is not available");
      return;
    }

    // Check if it's a PDF
    if (url.toLowerCase().endsWith(".pdf")) {
      try {
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await WebBrowser.openBrowserAsync(url);
        } else {
          Alert.alert("Error", "Cannot open PDF viewer");
        }
      } catch (error) {
        console.error("Error opening PDF:", error);
        Alert.alert("Error", "Failed to open PDF");
      }
    } else {
      // It's an image, show in modal
      setSelectedImageUrl(url);
      setImageModalVisible(true);
    }
  };
  const handleApproveDocument = async (doc: PendingDocument) => {
    try {
      const verifyingSet = new Set(verifyingIds);
      verifyingSet.add(`${doc.workerId}-${doc.documentType}`);
      setVerifyingIds(verifyingSet);

      await apiCall(
        api.workers.verifyIDProof(doc.workerId),
        "PUT",
        { status: "Verified", notes: "" },
        token!,
      );

      // Mark related notification as read
      await markRelatedNotificationsAsRead(doc.workerId);

      Alert.alert("Success", `${doc.documentType} approved!`);
      fetchPendingDocuments();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      const verifyingSet = new Set(verifyingIds);
      verifyingSet.delete(`${doc.workerId}-${doc.documentType}`);
      setVerifyingIds(verifyingSet);
    }
  };

  const handleRejectDocument = async (doc: PendingDocument) => {
    const notes = rejectionNotes[`${doc.workerId}-${doc.documentType}`];

    if (!notes || notes.trim().length === 0) {
      Alert.alert("Error", "Please provide rejection notes");
      return;
    }

    try {
      const verifyingSet = new Set(verifyingIds);
      verifyingSet.add(`${doc.workerId}-${doc.documentType}`);
      setVerifyingIds(verifyingSet);

      await apiCall(
        api.workers.verifyIDProof(doc.workerId),
        "PUT",
        { status: "Rejected", notes },
        token!,
      );

      // Mark related notification as read
      await markRelatedNotificationsAsRead(doc.workerId);

      Alert.alert("Success", `${doc.documentType} rejected with notes!`);
      const newNotes = { ...rejectionNotes };
      delete newNotes[`${doc.workerId}-${doc.documentType}`];
      setRejectionNotes(newNotes);
      fetchPendingDocuments();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      const verifyingSet = new Set(verifyingIds);
      verifyingSet.delete(`${doc.workerId}-${doc.documentType}`);
      setVerifyingIds(verifyingSet);
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };
  async (url: string) => {
    console.log("📄 Opening document:", url);

    // Check if it's a PDF
    if (url.toLowerCase().endsWith(".pdf")) {
      try {
        // Try to open PDF in browser
        const result = await WebBrowser.openBrowserAsync(url);
        console.log("PDF opened:", result);
      } catch (error) {
        console.error("Error opening PDF:", error);
        // Fallback to system browser
        Linking.openURL(url);
      }
    } else {
      // It's an image - show in modal
      setSelectedImageUrl(url);
      setImageModalVisible(true);
    }
    // In a real app, you would open the document URL in a viewer
    Alert.alert("Document", "Opening document URL:\n" + url);
  };

  const DocumentItem = ({
    item,
    index,
  }: {
    item: PendingDocument;
    index: number;
  }) => {
    const expandKey = `${item.workerId}-${item.documentType}`;
    const isExpanded = expandedId === expandKey;
    const isVerifying = verifyingIds.has(expandKey);

    return (
      <TouchableOpacity
        style={styles.documentItem}
        onPress={() => toggleExpand(expandKey)}
        activeOpacity={0.7}
      >
        <View style={styles.documentItemHeader}>
          <View style={styles.documentItemInfo}>
            <ThemedText style={styles.documentItemName}>
              {item.documentType}
            </ThemedText>
            <ThemedText style={styles.documentItemWorker}>
              {item.workerName} ({item.category})
            </ThemedText>
            <ThemedText style={styles.documentItemDate}>
              {new Date(item.uploadedAt).toLocaleDateString()} at{" "}
              {new Date(item.uploadedAt).toLocaleTimeString()}
            </ThemedText>
          </View>
          <Ionicons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={24}
            color="#0066CC"
          />
        </View>

        {isExpanded && (
          <View style={styles.documentItemExpanded}>
            {/* Worker Details */}
            <View style={styles.workerDetailsSection}>
              <ThemedText style={styles.sectionLabel}>
                Worker Information
              </ThemedText>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Name:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {item.workerName}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Email:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {item.workerEmail}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Phone:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {item.workerPhone}
                </ThemedText>
              </View>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Category:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {item.category}
                </ThemedText>
              </View>
            </View>

            {/* Document Details */}
            <View style={styles.documentDetailsSection}>
              <ThemedText style={styles.sectionLabel}>
                Document Information
              </ThemedText>
              <View style={styles.detailRow}>
                <ThemedText style={styles.detailLabel}>Type:</ThemedText>
                <ThemedText style={styles.detailValue}>
                  {item.document.documentType || "N/A"}
                </ThemedText>
              </View>
              {item.document.issueDate && (
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>
                    Issue Date:
                  </ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {new Date(item.document.issueDate).toLocaleDateString()}
                  </ThemedText>
                </View>
              )}
              {item.document.expiryDate && (
                <View style={styles.detailRow}>
                  <ThemedText style={styles.detailLabel}>
                    Expiry Date:
                  </ThemedText>
                  <ThemedText style={styles.detailValue}>
                    {new Date(item.document.expiryDate).toLocaleDateString()}
                  </ThemedText>
                </View>
              )}

              {/* Document Preview */}
              {item.document.url &&
                !item.document.url.toLowerCase().endsWith(".pdf") && (
                  <View style={styles.documentPreview}>
                    <ThemedText style={styles.detailLabel}>Preview:</ThemedText>
                    <Image
                      source={{ uri: item.document.url }}
                      style={styles.previewImage}
                      resizeMode="contain"
                      onError={(e) =>
                        console.error("Image load error:", e.nativeEvent.error)
                      }
                    />
                  </View>
                )}

              <TouchableOpacity
                style={styles.viewDocButton}
                onPress={() => openDocument(item.document.url)}
              >
                <Ionicons name="open-outline" size={16} color="#0066CC" />
                <ThemedText style={styles.viewDocButtonText}>
                  View Full Document
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Rejection Notes */}
            <View style={styles.notesSection}>
              <ThemedText style={styles.sectionLabel}>
                Rejection Notes (if rejecting)
              </ThemedText>
              <TextInput
                style={styles.notesInput}
                placeholder="Provide reason for rejection... (required to reject)"
                multiline
                numberOfLines={3}
                placeholderTextColor="#9CA3AF"
                value={rejectionNotes[expandKey] || ""}
                onChangeText={(text) =>
                  setRejectionNotes({
                    ...rejectionNotes,
                    [expandKey]: text,
                  })
                }
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtonsContainer}>
              <Button
                title={isVerifying ? "Processing..." : "Approve"}
                onPress={() => handleApproveDocument(item)}
                disabled={isVerifying}
              />
              <Button
                title={isVerifying ? "Processing..." : "Reject"}
                onPress={() => handleRejectDocument(item)}
                variant="secondary"
                disabled={isVerifying || !rejectionNotes[expandKey]?.trim()}
              />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator size="large" color="#0066CC" />
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Document Verification</ThemedText>
          <ThemedText style={styles.subtitle}>
            Review and approve/reject worker ID proofs
          </ThemedText>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}>
            <ThemedText style={styles.summaryNumber}>
              {pendingDocuments.length}
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>Pending</ThemedText>
          </View>
        </View>

        {/* Documents List */}
        {pendingDocuments.length > 0 ? (
          <View style={styles.documentsList}>
            <FlatList
              data={pendingDocuments}
              renderItem={({ item, index }) => (
                <DocumentItem item={item} index={index} />
              )}
              keyExtractor={(item, index) =>
                `${item.workerId}-${item.documentType}-${index}`
              }
              scrollEnabled={false}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle" size={64} color="#10B981" />
            <ThemedText style={styles.emptyTitle}>
              All documents verified!
            </ThemedText>
            <ThemedText style={styles.emptyText}>
              No pending documents to review
            </ThemedText>
          </View>
        )}
      </ScrollView>

      {/* Image Preview Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setImageModalVisible(false)}
            >
              <Ionicons name="close-circle" size={32} color="#fff" />
            </TouchableOpacity>

            {selectedImageUrl && (
              <Image
                source={{ uri: selectedImageUrl }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    marginBottom: 20,
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
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 20,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#0066CC",
  },
  summaryLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  documentsList: {
    marginBottom: 20,
  },
  documentItem: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
  },
  documentItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  documentItemInfo: {
    flex: 1,
  },
  documentItemName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  documentItemWorker: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 2,
  },
  documentItemDate: {
    fontSize: 12,
    opacity: 0.5,
  },
  documentItemExpanded: {
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    marginTop: 16,
    paddingTop: 16,
  },
  workerDetailsSection: {
    marginBottom: 16,
  },
  documentDetailsSection: {
    marginBottom: 16,
  },
  notesSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 10,
    opacity: 0.7,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: "500",
    opacity: 0.6,
  },
  detailValue: {
    fontSize: 12,
    fontWeight: "500",
  },
  viewDocButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 6,
  },
  viewDocButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#0066CC",
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    padding: 10,
    minHeight: 80,
    fontFamily: "System",
    fontSize: 13,
  },
  actionButtonsContainer: {
    gap: 10,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 8,
  },
  documentPreview: {
    marginBottom: 12,
  },
  previewImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginTop: 8,
    backgroundColor: "#F3F4F6",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  fullImage: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.8,
  },
});
