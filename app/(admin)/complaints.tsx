import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
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

const STATUS_OPTIONS = ["pending", "reviewing", "resolved", "dismissed"] as const;
type ComplaintStatus = (typeof STATUS_OPTIONS)[number];

const STATUS_META: Record<ComplaintStatus, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pending",   color: "#E65100", bg: "#FFF3E0" },
  reviewing: { label: "Reviewing", color: "#1565C0", bg: "#E3F2FD" },
  resolved:  { label: "Resolved",  color: "#2E7D32", bg: "#E8F5E9" },
  dismissed: { label: "Dismissed", color: "#616161", bg: "#F5F5F5" },
};

export default function ComplaintsScreen() {
  const { token } = useStore();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<ComplaintStatus | "all">("all");
  const [selected, setSelected] = useState<any | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [newStatus, setNewStatus] = useState<ComplaintStatus>("pending");
  const [saving, setSaving] = useState(false);

  const fetchComplaints = useCallback(async () => {
    if (!token) return;
    try {
      setLoading(true);
      const res = await apiCall(api.complaints.getAll, "GET", undefined, token);
      setComplaints(res?.data || []);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not load complaints.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { fetchComplaints(); }, [fetchComplaints]));

  const openDetail = (complaint: any) => {
    setSelected(complaint);
    setAdminNotes(complaint.adminNotes || "");
    setNewStatus(complaint.status as ComplaintStatus);
  };

  const handleUpdate = async () => {
    if (!selected || !token) return;
    try {
      setSaving(true);
      const res = await apiCall(
        api.complaints.update(selected._id),
        "PUT",
        { status: newStatus, adminNotes },
        token,
      );
      if (!res?.success) {
        Alert.alert("Error", res?.message || "Could not update complaint.");
        return;
      }
      setComplaints((prev) =>
        prev.map((c) => (c._id === selected._id ? res.data : c)),
      );
      setSelected(null);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not update complaint.");
    } finally {
      setSaving(false);
    }
  };

  const filtered = filterStatus === "all"
    ? complaints
    : complaints.filter((c) => c.status === filterStatus);

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Complaints</Text>
        <TouchableOpacity onPress={fetchComplaints} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Filter tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterRow}
      >
        {(["all", ...STATUS_OPTIONS] as const).map((s) => {
          const isActive = filterStatus === s;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.filterTab, isActive && { backgroundColor: Colors.primary, borderColor: Colors.primary }]}
              onPress={() => setFilterStatus(s)}
            >
              <Text style={[styles.filterTabText, isActive && { color: "white" }]}>
                {s === "all" ? "All" : STATUS_META[s].label}
                {s !== "all" && ` (${complaints.filter((c) => c.status === s).length})`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="flag-outline" size={48} color={Colors.border} />
          <Text style={styles.emptyText}>No complaints found</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.list}>
          {filtered.map((complaint) => {
            const status = complaint.status as ComplaintStatus;
            const meta = STATUS_META[status] || STATUS_META.pending;
            return (
              <TouchableOpacity
                key={complaint._id}
                style={styles.card}
                onPress={() => openDetail(complaint)}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
                    <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
                  </View>
                  <Text style={styles.dateText}>{formatDate(complaint.createdAt)}</Text>
                </View>

                <Text style={styles.categoryText}>{complaint.category}</Text>

                <View style={styles.partiesRow}>
                  <View style={styles.partyItem}>
                    <Ionicons name="person-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.partyText}>
                      {complaint.customerId?.name || "Unknown Customer"}
                    </Text>
                  </View>
                  <Ionicons name="arrow-forward" size={13} color={Colors.textSecondary} />
                  <View style={styles.partyItem}>
                    <Ionicons name="hammer-outline" size={13} color={Colors.textSecondary} />
                    <Text style={styles.partyText}>
                      {complaint.workerId?.name || "Unknown Worker"}
                    </Text>
                  </View>
                </View>

                <Text style={styles.descPreview} numberOfLines={2}>
                  {complaint.description}
                </Text>

                <View style={styles.tapHint}>
                  <Text style={styles.tapHintText}>Tap to review</Text>
                  <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Detail Modal */}
      <Modal visible={!!selected} transparent animationType="slide" onRequestClose={() => setSelected(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Complaint Detail</Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {selected && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Category */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Category</Text>
                  <Text style={styles.detailValue}>{selected.category}</Text>
                </View>

                {/* Parties */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Customer</Text>
                  <Text style={styles.detailValue}>
                    {selected.customerId?.name || "—"}
                    {selected.customerId?.email ? `  ·  ${selected.customerId.email}` : ""}
                  </Text>
                </View>
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Worker</Text>
                  <Text style={styles.detailValue}>
                    {selected.workerId?.name || "—"}
                    {selected.workerId?.category ? `  ·  ${selected.workerId.category}` : ""}
                  </Text>
                </View>

                {selected.jobId && (
                  <View style={styles.detailSection}>
                    <Text style={styles.detailLabel}>Related Job</Text>
                    <Text style={styles.detailValue}>
                      {selected.jobId?.serviceType || selected.jobId}
                    </Text>
                  </View>
                )}

                {/* Description */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailDesc}>{selected.description}</Text>
                </View>

                <View style={styles.divider} />

                {/* Status update */}
                <Text style={styles.detailLabel}>Update Status</Text>
                <View style={styles.statusOptions}>
                  {STATUS_OPTIONS.map((s) => (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.statusOption,
                        { backgroundColor: STATUS_META[s].bg, borderColor: STATUS_META[s].color },
                        newStatus === s && styles.statusOptionActive,
                      ]}
                      onPress={() => setNewStatus(s)}
                    >
                      <Text style={[styles.statusOptionText, { color: STATUS_META[s].color }]}>
                        {STATUS_META[s].label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Admin notes */}
                <Text style={[styles.detailLabel, { marginTop: 14 }]}>Admin Notes</Text>
                <TextInput
                  style={styles.notesInput}
                  placeholder="Add notes about this complaint..."
                  placeholderTextColor={Colors.textSecondary}
                  multiline
                  numberOfLines={3}
                  value={adminNotes}
                  onChangeText={setAdminNotes}
                  maxLength={500}
                  textAlignVertical="top"
                />

                <TouchableOpacity
                  style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                  onPress={handleUpdate}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  heading: { fontSize: 26, fontWeight: "bold", color: Colors.text },
  refreshBtn: { padding: 6 },
  filterScroll: { flexGrow: 0 },
  filterRow: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "white",
    alignSelf: "flex-start",
  },
  filterTabText: { fontSize: 12, fontWeight: "600", color: Colors.text },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: Colors.textSecondary, marginTop: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 20, gap: 12 },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: { fontSize: 11, fontWeight: "700" },
  dateText: { fontSize: 11, color: Colors.textSecondary },
  categoryText: { fontSize: 14, fontWeight: "700", color: Colors.text, marginBottom: 8 },
  partiesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  partyItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  partyText: { fontSize: 12, color: Colors.textSecondary },
  descPreview: { fontSize: 12, color: Colors.text, lineHeight: 18, marginBottom: 8 },
  tapHint: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 2 },
  tapHintText: { fontSize: 11, color: Colors.primary, fontWeight: "600" },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: Colors.text },
  detailSection: { marginBottom: 12 },
  detailLabel: { fontSize: 11, fontWeight: "700", color: Colors.textSecondary, marginBottom: 4, textTransform: "uppercase" },
  detailValue: { fontSize: 14, color: Colors.text, fontWeight: "500" },
  detailDesc: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 20,
    backgroundColor: Colors.lightBackground,
    padding: 10,
    borderRadius: 8,
  },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 14 },
  statusOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  statusOption: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1.5,
    opacity: 0.6,
  },
  statusOptionActive: { opacity: 1 },
  statusOptionText: { fontSize: 13, fontWeight: "700" },
  notesInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.text,
    minHeight: 80,
    marginTop: 6,
    marginBottom: 16,
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 8,
  },
  saveBtnText: { color: "white", fontSize: 15, fontWeight: "700" },
});
