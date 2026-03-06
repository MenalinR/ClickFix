import { Button } from "@/components/Button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useStore } from "@/constants/Store";
import { api, apiCall } from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View
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
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState<{
    [key: string]: string;
  }>({});
  const [verifyingIds, setVerifyingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPendingDocuments();
  }, []);

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

  const openDocument = (url: string) => {
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
});
