import { Button } from "@/components/Button";
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
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type DocumentStatus = "Pending" | "Verified" | "Rejected";
type DatePickerField = "expStart" | "expEnd" | "eduStart" | "eduEnd";

interface Document {
  _id?: string;
  title?: string;
  name?: string;
  documentName?: string;
  institution?: string;
  description?: string;
  url: string;
  documentType: string;
  verificationStatus: DocumentStatus;
  verificationNotes?: string;
  issueDate?: string;
  expiryDate?: string;
  startDate?: string;
  endDate?: string;
}

interface IDProof extends Document {
  uploadedAt?: string;
  verifiedAt?: string;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const getYearOptions = () => {
  const currentYear = new Date().getFullYear();
  const years: number[] = [];
  for (let y = currentYear + 1; y >= 1980; y--) years.push(y);
  return years;
};

function monthYearToIso(month: number | "", year: number | ""): string {
  if (month === "" || year === "" || !month || !year) return "";
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

function isoToMonthYear(iso: string | undefined): {
  month: number | "";
  year: number | "";
} {
  if (!iso) return { month: "", year: "" };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { month: "", year: "" };
  return { month: d.getMonth() + 1, year: d.getFullYear() };
}

function formatMonthYear(month: number | "", year: number | ""): string {
  if (month === "" || year === "") return "Select";
  return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

function formatRangeWithPresent(start?: string, end?: string): string {
  const startText = start
    ? formatMonthYear(isoToMonthYear(start).month, isoToMonthYear(start).year)
    : "";
  const endText = end
    ? formatMonthYear(isoToMonthYear(end).month, isoToMonthYear(end).year)
    : "Present";

  if (!startText || startText === "Select") return endText;
  return `${startText} – ${endText}`;
}

function isLocalFileUri(uri: string): boolean {
  return !!uri && !uri.startsWith("http://") && !uri.startsWith("https://");
}

export default function DocumentsScreen() {
  const { user, token } = useStore();
  const [loading, setLoading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<any>(null);

  // ID Proof form
  const [idDocumentType, setIdDocumentType] = useState("NIC");
  const [idDocumentUrl, setIdDocumentUrl] = useState("");
  const [idUploading, setIdUploading] = useState(false);
  const [idTypeModalVisible, setIdTypeModalVisible] = useState(false);

  // Experience document form - new structure
  const [showExpForm, setShowExpForm] = useState(false);
  const [expFormMode, setExpFormMode] = useState<"add" | "edit">("add");
  const [expTitle, setExpTitle] = useState("");
  const [expDescription, setExpDescription] = useState("");
  const [expCertificateName, setExpCertificateName] = useState("");
  const [expCertificateUrl, setExpCertificateUrl] = useState("");
  const [expStartMonth, setExpStartMonth] = useState<number | "">("");
  const [expStartYear, setExpStartYear] = useState<number | "">("");
  const [expEndMonth, setExpEndMonth] = useState<number | "">("");
  const [expEndYear, setExpEndYear] = useState<number | "">("");
  const [expUploading, setExpUploading] = useState(false);
  const [editingExpId, setEditingExpId] = useState<string | null>(null);

  // Education document form
  const [showEduForm, setShowEduForm] = useState(false);
  const [eduFormMode, setEduFormMode] = useState<"add" | "edit">("add");
  const [eduDocumentName, setEduDocumentName] = useState("");
  const [eduInstitution, setEduInstitution] = useState("");
  const [eduDescription, setEduDescription] = useState("");
  const [eduDocumentUrl, setEduDocumentUrl] = useState("");
  const [eduDocumentType, setEduDocumentType] = useState("Certificate");
  const [eduStartMonth, setEduStartMonth] = useState<number | "">("");
  const [eduStartYear, setEduStartYear] = useState<number | "">("");
  const [eduEndMonth, setEduEndMonth] = useState<number | "">("");
  const [eduEndYear, setEduEndYear] = useState<number | "">("");
  const [eduUploading, setEduUploading] = useState(false);
  const [eduTypeModalVisible, setEduTypeModalVisible] = useState(false);
  const [editingEduId, setEditingEduId] = useState<string | null>(null);

  // Month/Year picker modal: which field is being edited
  const [datePickerTarget, setDatePickerTarget] =
    useState<DatePickerField | null>(null);
  const [datePickerStep, setDatePickerStep] = useState<"month" | "year">(
    "month",
  );
  const YEAR_OPTIONS = getYearOptions();

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

      // Fallback: if some backend instances don't include educationDocuments
      // in verification-status response, fetch from worker profile endpoint.
      const workerProfileResponse = await apiCall(
        api.workers.getById(user._id),
        "GET",
      );

      const verificationData = response?.data || {};
      const profileData = workerProfileResponse?.data || {};

      setVerificationStatus({
        ...verificationData,
        experienceDocuments:
          verificationData.experienceDocuments ||
          profileData.experienceDocuments ||
          [],
        educationDocuments:
          verificationData.educationDocuments ||
          profileData.educationDocuments ||
          [],
      });
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

  const pickFromCamera = async (setUrl: (url: string) => void) => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission needed",
          "Allow camera access to take a photo.",
        );
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.85 });
      if (!result.canceled && result.assets?.[0]) {
        setUrl(result.assets[0].uri);
      }
    } catch {
      Alert.alert("Error", "Failed to capture photo");
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

  const handlePickDocument = (
    setUrl: (url: string) => void,
    _isExperience: boolean = false,
  ) => {
    Alert.alert("Select document", "Choose how to upload your document", [
      { text: "Take Photo", onPress: () => pickFromCamera(setUrl) },
      { text: "Choose from Photos", onPress: () => pickFromGallery(setUrl) },
      { text: "Pick PDF / File", onPress: () => pickPdf(setUrl) },
      { text: "Cancel", style: "cancel" },
    ]);
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

      // Create FormData for file upload
      const formData = new FormData();

      // Get filename and determine file type
      const filename = idDocumentUrl.split("/").pop() || "document.jpg";
      const match = /\.(\w+)$/.exec(filename);
      const extension = match ? match[1] : "jpg";

      // Determine proper MIME type
      let mimeType = "image/jpeg";
      if (extension === "pdf") {
        mimeType = "application/pdf";
      } else if (extension === "png") {
        mimeType = "image/png";
      } else if (extension === "jpg" || extension === "jpeg") {
        mimeType = "image/jpeg";
      }

      // Append the file - React Native FormData format
      formData.append("document", {
        uri: idDocumentUrl,
        name: filename,
        type: mimeType,
      } as any);

      // Append other fields as strings
      formData.append("documentType", idDocumentType);

      console.log("📤 Uploading ID proof:", { filename, type: mimeType });

      // Upload using apiUpload instead of apiCall
      const response = await apiUpload(
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

  const handleUploadExperienceDocument = async () => {
    if (!user?._id) {
      Alert.alert("Error", "User information not loaded. Please try again.");
      return;
    }

    if (!expTitle.trim()) {
      Alert.alert("Error", "Please enter an experience title");
      return;
    }

    if (!expDescription.trim()) {
      Alert.alert("Error", "Please enter your experience description");
      return;
    }

    try {
      setExpUploading(true);

      const formData = new FormData();

      let filename = "";
      let mimeType = "";

      if (expCertificateUrl.trim() && isLocalFileUri(expCertificateUrl)) {
        filename = expCertificateUrl.split("/").pop() || "certificate.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const extension = match ? match[1] : "jpg";

        mimeType = "image/jpeg";
        if (extension === "pdf") {
          mimeType = "application/pdf";
        } else if (extension === "png") {
          mimeType = "image/png";
        } else if (extension === "jpg" || extension === "jpeg") {
          mimeType = "image/jpeg";
        }

        formData.append("document", {
          uri: expCertificateUrl,
          name: filename,
          type: mimeType,
        } as any);
      }

      // Append other fields as strings
      if (expCertificateName.trim()) {
        formData.append("documentName", expCertificateName);
      }
      formData.append("title", expTitle);
      formData.append("documentType", "Certificate");
      formData.append("description", expDescription);
      const expIssue = monthYearToIso(expStartMonth, expStartYear);
      const expExpiry = monthYearToIso(expEndMonth, expEndYear);
      if (expIssue) formData.append("issueDate", expIssue);
      if (expExpiry) formData.append("expiryDate", expExpiry);

      console.log("📤 Saving experience:", {
        hasCertificate: !!expCertificateUrl.trim(),
        filename,
        type: mimeType,
      });

      // Upload using apiUpload instead of apiCall
      const response = await apiUpload(
        expFormMode === "edit" && editingExpId
          ? api.workers.updateExperience(user._id, editingExpId)
          : api.workers.uploadExperience(user._id),
        formData,
        token!,
        expFormMode === "edit" ? "PUT" : "POST",
      );

      Alert.alert(
        "Success",
        expFormMode === "edit"
          ? "Experience updated successfully!"
          : "Experience saved successfully!",
      );
      resetExpForm();
      fetchVerificationStatus();
    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setExpUploading(false);
    }
  };

  const resetExpForm = () => {
    setExpTitle("");
    setExpDescription("");
    setExpCertificateName("");
    setExpCertificateUrl("");
    setExpStartMonth("");
    setExpStartYear("");
    setExpEndMonth("");
    setExpEndYear("");
    setShowExpForm(false);
    setEditingExpId(null);
    setExpFormMode("add");
  };

  const resetEduForm = () => {
    setEduDocumentName("");
    setEduInstitution("");
    setEduDescription("");
    setEduDocumentUrl("");
    setEduDocumentType("Certificate");
    setEduStartMonth("");
    setEduStartYear("");
    setEduEndMonth("");
    setEduEndYear("");
    setShowEduForm(false);
    setEditingEduId(null);
    setEduFormMode("add");
  };

  const openDatePicker = (field: DatePickerField) => {
    setDatePickerTarget(field);
    setDatePickerStep("month");
  };

  const closeDatePicker = () => {
    setDatePickerTarget(null);
    setDatePickerStep("month");
  };

  const handleMonthSelect = (month: number) => {
    if (datePickerTarget === "expStart") setExpStartMonth(month);
    else if (datePickerTarget === "expEnd") setExpEndMonth(month);
    else if (datePickerTarget === "eduStart") setEduStartMonth(month);
    else if (datePickerTarget === "eduEnd") setEduEndMonth(month);

    setDatePickerStep("year");
  };

  const handleYearSelect = (year: number) => {
    if (datePickerTarget === "expStart") setExpStartYear(year);
    else if (datePickerTarget === "expEnd") setExpEndYear(year);
    else if (datePickerTarget === "eduStart") setEduStartYear(year);
    else if (datePickerTarget === "eduEnd") setEduEndYear(year);

    closeDatePicker();
  };

  const setEndDateAsPresent = () => {
    if (datePickerTarget === "expEnd") {
      setExpEndMonth("");
      setExpEndYear("");
    } else if (datePickerTarget === "eduEnd") {
      setEduEndMonth("");
      setEduEndYear("");
    }

    closeDatePicker();
  };

  const getDateFieldDisplay = (
    month: number | "",
    year: number | "",
    placeholder: string,
    showPresentWhenEmpty: boolean = false,
  ) => {
    if (month === "" || year === "") {
      return showPresentWhenEmpty ? "Present" : placeholder;
    }
    return formatMonthYear(month, year);
  };

  const handleDeleteExperienceDocument = (doc: Document) => {
    if (!user?._id) {
      Alert.alert("Error", "User information not loaded. Please try again.");
      return;
    }

    if (!doc._id) {
      Alert.alert(
        "Error",
        "Cannot delete this item right now. Please refresh.",
      );
      return;
    }

    Alert.alert(
      "Delete Experience",
      "Are you sure you want to delete this experience?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiCall(
                api.workers.deleteExperience(user._id, doc._id!),
                "DELETE",
                undefined,
                token!,
              );
              Alert.alert("Success", "Experience deleted successfully.");
              fetchVerificationStatus();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "Failed to delete experience",
              );
            }
          },
        },
      ],
    );
  };

  const handleDeleteEducationDocument = (doc: Document) => {
    if (!user?._id) {
      Alert.alert("Error", "User information not loaded. Please try again.");
      return;
    }

    if (!doc._id) {
      Alert.alert(
        "Error",
        "Cannot delete this item right now. Please refresh.",
      );
      return;
    }

    Alert.alert(
      "Delete Education",
      "Are you sure you want to delete this education record?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await apiCall(
                api.workers.deleteEducation(user._id, doc._id!),
                "DELETE",
                undefined,
                token!,
              );
              Alert.alert("Success", "Education deleted successfully.");
              fetchVerificationStatus();
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "Failed to delete education",
              );
            }
          },
        },
      ],
    );
  };

  const handleUploadEducationDocument = async () => {
    if (!user?._id) {
      Alert.alert("Error", "User information not loaded. Please try again.");
      return;
    }

    if (!eduDocumentName.trim() || !eduDescription.trim()) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    if (eduFormMode !== "edit" && !eduDocumentUrl.trim()) {
      Alert.alert("Error", "Please upload a document file");
      return;
    }

    try {
      setEduUploading(true);

      // Create FormData for file upload
      const formData = new FormData();

      let filename = "";
      let mimeType = "";

      if (eduDocumentUrl.trim() && isLocalFileUri(eduDocumentUrl)) {
        filename = eduDocumentUrl.split("/").pop() || "education.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const extension = match ? match[1] : "jpg";

        // Determine proper MIME type
        mimeType = "image/jpeg";
        if (extension === "pdf") {
          mimeType = "application/pdf";
        } else if (extension === "png") {
          mimeType = "image/png";
        } else if (extension === "jpg" || extension === "jpeg") {
          mimeType = "image/jpeg";
        }

        // Append the file - React Native FormData format
        formData.append("document", {
          uri: eduDocumentUrl,
          name: filename,
          type: mimeType,
        } as any);
      }

      // Append other fields as strings
      formData.append("documentName", eduDocumentName);
      formData.append("institution", eduInstitution);
      formData.append("documentType", eduDocumentType);
      formData.append("description", eduDescription);
      const eduStart = monthYearToIso(eduStartMonth, eduStartYear);
      const eduEnd = monthYearToIso(eduEndMonth, eduEndYear);
      if (eduStart) formData.append("startDate", eduStart);
      if (eduEnd) formData.append("endDate", eduEnd);

      console.log("📤 Uploading education document:", {
        filename,
        type: mimeType,
      });

      // Upload using apiUpload instead of apiCall
      const response = await apiUpload(
        eduFormMode === "edit" && editingEduId
          ? api.workers.updateEducation(user._id, editingEduId)
          : api.workers.uploadEducation(user._id),
        formData,
        token!,
        eduFormMode === "edit" ? "PUT" : "POST",
      );

      Alert.alert(
        "Success",
        eduFormMode === "edit"
          ? "Education updated successfully!"
          : "Education document uploaded successfully!",
      );
      resetEduForm();
      fetchVerificationStatus();
    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert("Error", error.message);
    } finally {
      setEduUploading(false);
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
  const expDocs = verificationStatus?.experienceDocuments || [];
  const eduDocs = verificationStatus?.educationDocuments || [];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ThemedView style={styles.innerContainer}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.title}>Documents</ThemedText>
          <ThemedText style={styles.subtitle}>
            Upload ID proof for verification and add experience proof to your
            profile. Add your education documents as well.
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

            <Button
              title={idDocumentUrl ? "Document Selected ✓" : "Select Document"}
              onPress={() => handlePickDocument(setIdDocumentUrl)}
              variant="secondary"
            />

            <Button
              title={idUploading ? "Uploading..." : "Upload ID Proof"}
              onPress={handleUploadIDProof}
              disabled={!idDocumentUrl || idUploading}
            />
          </View>
        </View>

        {/* EXPERIENCE DOCUMENTS SECTION - LinkedIn Style */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Experience</ThemedText>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setExpFormMode("add");
                setShowExpForm(true);
              }}
            >
              <Ionicons name="add-circle" size={28} color="#0066CC" />
            </TouchableOpacity>
          </View>

          {expDocs.length > 0 ? (
            expDocs.map((doc: Document, index: number) => (
              <View key={doc._id || index} style={styles.experienceCard}>
                <View style={styles.experienceHeader}>
                  <View style={styles.experienceInfo}>
                    <ThemedText style={styles.certificateName}>
                      {doc.title || doc.name || doc.description || "Experience"}
                    </ThemedText>
                    <ThemedText style={styles.experienceDescription}>
                      {doc.description || "No description provided"}
                    </ThemedText>
                    {(doc.issueDate || doc.expiryDate) && (
                      <ThemedText style={styles.dateRangeText}>
                        {formatRangeWithPresent(doc.issueDate, doc.expiryDate)}
                      </ThemedText>
                    )}
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        setEditingExpId(doc._id || null);
                        setExpTitle(
                          doc.title || doc.name || doc.description || "",
                        );
                        setExpDescription(doc.description || "");
                        setExpCertificateName(doc.name || "");
                        setExpCertificateUrl(doc.url);
                        const start = isoToMonthYear(doc.issueDate);
                        const end = isoToMonthYear(doc.expiryDate);
                        setExpStartMonth(start.month);
                        setExpStartYear(start.year);
                        setExpEndMonth(end.month);
                        setExpEndYear(end.year);
                        setExpFormMode("edit");
                        setShowExpForm(true);
                      }}
                    >
                      <Ionicons name="pencil" size={18} color="#0066CC" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteExperienceDocument(doc)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {doc.url && (
                  <View style={styles.certificateThumbnailContainer}>
                    <Image
                      source={{ uri: doc.url }}
                      style={styles.certificateThumbnail}
                      onError={() =>
                        console.log("Image loading error for:", doc.url)
                      }
                    />
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="briefcase" size={48} color="#9CA3AF" />
              <ThemedText style={styles.emptyText}>
                No experience added yet
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Add your work experience. Certificates are optional.
              </ThemedText>
            </View>
          )}
        </View>

        {/* Experience Form Modal */}
        <Modal
          visible={showExpForm}
          transparent
          animationType="slide"
          onRequestClose={resetExpForm}
        >
          <View style={styles.formModalContainer}>
            <View style={styles.formModalContent}>
              {/* Form Header */}
              <View style={styles.formModalHeader}>
                <ThemedText style={styles.formModalTitle}>
                  {expFormMode === "add" ? "Add Experience" : "Edit Experience"}
                </ThemedText>
                <TouchableOpacity onPress={resetExpForm}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.formModalScroll}>
                {/* Experience Title */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.formLabel}>
                    Experience Title *
                  </ThemedText>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., HVAC Technician"
                    placeholderTextColor="#9CA3AF"
                    value={expTitle}
                    onChangeText={setExpTitle}
                  />
                </View>

                {/* Experience Description */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.formLabel}>
                    Experience Description *
                  </ThemedText>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Describe your experience (e.g., 5+ years HVAC technician)"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    value={expDescription}
                    onChangeText={setExpDescription}
                  />
                </View>

                {/* Experience Start Date */}
                <TouchableOpacity
                  style={styles.dateInputWrapper}
                  activeOpacity={0.8}
                  onPress={() => openDatePicker("expStart")}
                >
                  <ThemedText style={styles.dateInputLabel}>
                    Start date*
                  </ThemedText>
                  <View style={styles.dateInputField}>
                    <ThemedText
                      style={[
                        styles.dateInputValue,
                        expStartMonth === "" || expStartYear === ""
                          ? styles.dateInputPlaceholder
                          : undefined,
                      ]}
                    >
                      {getDateFieldDisplay(
                        expStartMonth,
                        expStartYear,
                        "Start date*",
                      )}
                    </ThemedText>
                    <Ionicons
                      name="calendar-outline"
                      size={24}
                      color="#1F2937"
                    />
                  </View>
                </TouchableOpacity>

                {/* Experience End Date */}
                <TouchableOpacity
                  style={styles.dateInputWrapper}
                  activeOpacity={0.8}
                  onPress={() => openDatePicker("expEnd")}
                >
                  <ThemedText style={styles.dateInputLabel}>
                    End date*
                  </ThemedText>
                  <View style={styles.dateInputField}>
                    <ThemedText
                      style={[
                        styles.dateInputValue,
                        expEndMonth === "" || expEndYear === ""
                          ? styles.dateInputPlaceholder
                          : undefined,
                      ]}
                    >
                      {getDateFieldDisplay(
                        expEndMonth,
                        expEndYear,
                        "End date*",
                        true,
                      )}
                    </ThemedText>
                    <Ionicons
                      name="calendar-outline"
                      size={24}
                      color="#1F2937"
                    />
                  </View>
                </TouchableOpacity>

                {/* Certificate Name */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.formLabel}>
                    Certificate Name (Optional)
                  </ThemedText>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., HVAC Technician Certification"
                    placeholderTextColor="#9CA3AF"
                    value={expCertificateName}
                    onChangeText={setExpCertificateName}
                  />
                </View>

                {/* Upload Certificate */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.formLabel}>
                    Upload Certificate (Optional)
                  </ThemedText>
                  {expCertificateUrl && (
                    <View style={styles.fileSelectedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#10B981"
                      />
                      <ThemedText style={styles.fileSelectedText}>
                        Document selected
                      </ThemedText>
                    </View>
                  )}
                  <Button
                    title={
                      expCertificateUrl
                        ? "Document Selected ✓"
                        : "Select Certificate (Optional)"
                    }
                    onPress={() =>
                      handlePickDocument(setExpCertificateUrl, true)
                    }
                    variant="secondary"
                  />
                </View>

                {/* Action Buttons */}
                <View style={styles.formActions}>
                  <Button
                    title={expUploading ? "Saving..." : "Save Experience"}
                    onPress={handleUploadExperienceDocument}
                    disabled={!expTitle || !expDescription || expUploading}
                  />
                  <Button
                    title="Cancel"
                    onPress={resetExpForm}
                    variant="secondary"
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* EDUCATION DOCUMENTS SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>Education</ThemedText>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => {
                setEduFormMode("add");
                setShowEduForm(true);
              }}
            >
              <Ionicons name="add-circle" size={28} color="#0066CC" />
            </TouchableOpacity>
          </View>

          {eduDocs.length > 0 ? (
            eduDocs.map((doc: Document, index: number) => (
              <View key={doc._id || index} style={styles.experienceCard}>
                <View style={styles.experienceHeader}>
                  <View style={styles.experienceInfo}>
                    <ThemedText style={styles.certificateName}>
                      {doc.name || "Unnamed Education"}
                    </ThemedText>
                    {!!doc.institution && (
                      <ThemedText style={styles.institutionText}>
                        {doc.institution}
                      </ThemedText>
                    )}
                    <ThemedText style={styles.experienceDescription}>
                      {doc.description || "No description provided"}
                    </ThemedText>
                    {(doc.startDate || doc.endDate) && (
                      <ThemedText style={styles.dateRangeText}>
                        {formatRangeWithPresent(doc.startDate, doc.endDate)}
                      </ThemedText>
                    )}
                  </View>
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={styles.editButton}
                      onPress={() => {
                        setEditingEduId(doc._id || null);
                        setEduDocumentName(doc.name || "");
                        setEduInstitution(doc.institution || "");
                        setEduDescription(doc.description || "");
                        setEduDocumentUrl(doc.url);
                        setEduDocumentType(doc.documentType || "Certificate");
                        const start = isoToMonthYear(doc.startDate);
                        const end = isoToMonthYear(doc.endDate);
                        setEduStartMonth(start.month);
                        setEduStartYear(start.year);
                        setEduEndMonth(end.month);
                        setEduEndYear(end.year);
                        setEduFormMode("edit");
                        setShowEduForm(true);
                      }}
                    >
                      <Ionicons name="pencil" size={18} color="#0066CC" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteEducationDocument(doc)}
                    >
                      <Ionicons
                        name="trash-outline"
                        size={18}
                        color="#EF4444"
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                {doc.url && (
                  <View style={styles.certificateThumbnailContainer}>
                    <Image
                      source={{ uri: doc.url }}
                      style={styles.certificateThumbnail}
                      onError={() =>
                        console.log("Image loading error for:", doc.url)
                      }
                    />
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="school" size={48} color="#9CA3AF" />
              <ThemedText style={styles.emptyText}>
                No education added yet
              </ThemedText>
              <ThemedText style={styles.emptySubtext}>
                Add your degrees, diplomas, and certificates
              </ThemedText>
            </View>
          )}
        </View>

        {/* Education Form Modal */}
        <Modal
          visible={showEduForm}
          transparent
          animationType="slide"
          onRequestClose={resetEduForm}
        >
          <View style={styles.formModalContainer}>
            <View style={styles.formModalContent}>
              {/* Form Header */}
              <View style={styles.formModalHeader}>
                <ThemedText style={styles.formModalTitle}>
                  {eduFormMode === "add" ? "Add Education" : "Edit Education"}
                </ThemedText>
                <TouchableOpacity onPress={resetEduForm}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={styles.formModalScroll}>
                {/* Document Name */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.formLabel}>
                    Degree/Certificate Name *
                  </ThemedText>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., Bachelor of Engineering"
                    placeholderTextColor="#9CA3AF"
                    value={eduDocumentName}
                    onChangeText={setEduDocumentName}
                  />
                </View>

                {/* Institution */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.formLabel}>
                    Institution Name
                  </ThemedText>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g., University of Colombo"
                    placeholderTextColor="#9CA3AF"
                    value={eduInstitution}
                    onChangeText={setEduInstitution}
                  />
                </View>

                {/* Education Start Date */}
                <TouchableOpacity
                  style={styles.dateInputWrapper}
                  activeOpacity={0.8}
                  onPress={() => openDatePicker("eduStart")}
                >
                  <ThemedText style={styles.dateInputLabel}>
                    Start date*
                  </ThemedText>
                  <View style={styles.dateInputField}>
                    <ThemedText
                      style={[
                        styles.dateInputValue,
                        eduStartMonth === "" || eduStartYear === ""
                          ? styles.dateInputPlaceholder
                          : undefined,
                      ]}
                    >
                      {getDateFieldDisplay(
                        eduStartMonth,
                        eduStartYear,
                        "Start date*",
                      )}
                    </ThemedText>
                    <Ionicons
                      name="calendar-outline"
                      size={24}
                      color="#1F2937"
                    />
                  </View>
                </TouchableOpacity>

                {/* Education End Date */}
                <TouchableOpacity
                  style={styles.dateInputWrapper}
                  activeOpacity={0.8}
                  onPress={() => openDatePicker("eduEnd")}
                >
                  <ThemedText style={styles.dateInputLabel}>
                    End date*
                  </ThemedText>
                  <View style={styles.dateInputField}>
                    <ThemedText
                      style={[
                        styles.dateInputValue,
                        eduEndMonth === "" || eduEndYear === ""
                          ? styles.dateInputPlaceholder
                          : undefined,
                      ]}
                    >
                      {getDateFieldDisplay(
                        eduEndMonth,
                        eduEndYear,
                        "End date*",
                        true,
                      )}
                    </ThemedText>
                    <Ionicons
                      name="calendar-outline"
                      size={24}
                      color="#1F2937"
                    />
                  </View>
                </TouchableOpacity>

                {/* Document Type */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.formLabel}>
                    Document Type *
                  </ThemedText>
                  <TouchableOpacity
                    style={styles.dropdown}
                    onPress={() => setEduTypeModalVisible(true)}
                  >
                    <ThemedText style={styles.dropdownText}>
                      {eduDocumentType}
                    </ThemedText>
                    <Ionicons name="chevron-down" size={20} color="#0066CC" />
                  </TouchableOpacity>
                </View>

                {/* Description */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.formLabel}>
                    Description *
                  </ThemedText>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Describe your education background"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                    value={eduDescription}
                    onChangeText={setEduDescription}
                  />
                </View>

                {/* Upload Document */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.formLabel}>
                    Upload Document *
                  </ThemedText>
                  {eduDocumentUrl && (
                    <View style={styles.fileSelectedBadge}>
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color="#10B981"
                      />
                      <ThemedText style={styles.fileSelectedText}>
                        Document selected
                      </ThemedText>
                    </View>
                  )}
                  <Button
                    title={
                      eduDocumentUrl ? "Document Selected ✓" : "Select Document"
                    }
                    onPress={() => handlePickDocument(setEduDocumentUrl, true)}
                    variant="secondary"
                  />
                </View>

                {/* Action Buttons */}
                <View style={styles.formActions}>
                  <Button
                    title={eduUploading ? "Saving..." : "Save Education"}
                    onPress={handleUploadEducationDocument}
                    disabled={
                      !eduDocumentName || !eduDescription || eduUploading
                    }
                  />
                  <Button
                    title="Cancel"
                    onPress={resetEduForm}
                    variant="secondary"
                  />
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>

        {/* Education Type Modal */}
        <Modal
          transparent
          visible={eduTypeModalVisible}
          onRequestClose={() => setEduTypeModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setEduTypeModalVisible(false)}
          >
            <View style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>
                Select Document Type
              </ThemedText>
              {["Degree", "Diploma", "Certificate", "Other"].map((type) => (
                <TouchableOpacity
                  key={type}
                  style={styles.modalOption}
                  onPress={() => {
                    setEduDocumentType(type);
                    setEduTypeModalVisible(false);
                  }}
                >
                  <Ionicons
                    name={
                      eduDocumentType === type
                        ? "radio-button-on"
                        : "radio-button-off"
                    }
                    size={20}
                    color="#0066CC"
                  />
                  <ThemedText style={styles.modalOptionText}>{type}</ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Month/Year Picker Modal */}
        <Modal
          transparent
          visible={!!datePickerTarget}
          onRequestClose={closeDatePicker}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={closeDatePicker}
          >
            <View style={styles.modalContent}>
              <ThemedText style={styles.modalTitle}>
                {datePickerStep === "month" ? "Select Month" : "Select Year"}
              </ThemedText>
              {(datePickerTarget === "expEnd" ||
                datePickerTarget === "eduEnd") && (
                <TouchableOpacity
                  style={styles.presentOption}
                  onPress={setEndDateAsPresent}
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={20}
                    color="#0066CC"
                  />
                  <ThemedText style={styles.presentOptionText}>
                    Set as Present
                  </ThemedText>
                </TouchableOpacity>
              )}
              <ScrollView
                style={styles.pickerScroll}
                keyboardShouldPersistTaps="handled"
              >
                {datePickerStep === "month"
                  ? MONTH_NAMES.map((name, idx) => (
                      <TouchableOpacity
                        key={name}
                        style={styles.modalOption}
                        onPress={() => handleMonthSelect(idx + 1)}
                      >
                        <ThemedText style={styles.modalOptionText}>
                          {name}
                        </ThemedText>
                      </TouchableOpacity>
                    ))
                  : YEAR_OPTIONS.map((year) => (
                      <TouchableOpacity
                        key={year}
                        style={styles.modalOption}
                        onPress={() => handleYearSelect(year)}
                      >
                        <ThemedText style={styles.modalOptionText}>
                          {String(year)}
                        </ThemedText>
                      </TouchableOpacity>
                    ))}
              </ScrollView>
            </View>
          </TouchableOpacity>
        </Modal>

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
  typeSelector: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
    flexWrap: "wrap",
  },
  typeButton: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#F9FAFB",
  },
  typeButtonActive: {
    borderColor: "#0066CC",
    backgroundColor: "#EFF6FF",
  },
  typeButtonText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  typeButtonTextActive: {
    color: "#0066CC",
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
  input: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    backgroundColor: "#F9FAFB",
  },
  inputText: {
    fontSize: 14,
  },
  inputPlaceholder: {
    opacity: 0.5,
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
  // New styles for LinkedIn-style experience section
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  addButton: {
    padding: 4,
  },
  experienceCard: {
    borderLeftWidth: 4,
    borderLeftColor: "#0066CC",
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  experienceInfo: {
    flex: 1,
  },
  certificateName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    color: "#1F2937",
  },
  institutionText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#0066CC",
    marginBottom: 4,
  },
  experienceDescription: {
    fontSize: 13,
    opacity: 0.7,
    color: "#6B7280",
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  editButton: {
    padding: 6,
  },
  deleteButton: {
    padding: 6,
  },
  certificateThumbnailContainer: {
    marginTop: 12,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",
    height: 120,
    width: 120,
  },
  certificateThumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  emptySubtext: {
    marginTop: 4,
    fontSize: 12,
    opacity: 0.6,
  },
  // Form modal styles
  formModalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  formModalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  formModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  formModalTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  formModalScroll: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  formGroup: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1F2937",
  },
  dateInputWrapper: {
    marginBottom: 24,
  },
  dateInputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 6,
  },
  dateInputField: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#4B5563",
    paddingBottom: 8,
  },
  dateInputValue: {
    flex: 1,
    fontSize: 18,
    color: "#111827",
  },
  dateInputPlaceholder: {
    color: "#9CA3AF",
  },
  pickerScroll: {
    maxHeight: 280,
  },
  presentOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingBottom: 14,
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
  },
  presentOptionText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0066CC",
  },
  dateRangeText: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "System",
  },
  fileSelectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ECFDF5",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    gap: 8,
  },
  fileSelectedText: {
    fontSize: 13,
    color: "#059669",
    fontWeight: "500",
  },
  formActions: {
    gap: 10,
    paddingBottom: 20,
  },
});
