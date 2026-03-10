import { Button } from "@/components/Button";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { useStore } from "@/constants/Store";
import { api, apiCall, apiUpload } from "@/constants/api";
import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
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

interface Document {
  _id?: string;
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
}

interface IDProof extends Document {
  uploadedAt?: string;
  verifiedAt?: string;
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
  const [expDescription, setExpDescription] = useState("");
  const [expCertificateName, setExpCertificateName] = useState("");
  const [expCertificateUrl, setExpCertificateUrl] = useState("");
  const [expUploading, setExpUploading] = useState(false);
  const [editingExpIndex, setEditingExpIndex] = useState<number | null>(null);

  // Education document form
  const [showEduForm, setShowEduForm] = useState(false);
  const [eduFormMode, setEduFormMode] = useState<"add" | "edit">("add");
  const [eduDocumentName, setEduDocumentName] = useState("");
  const [eduInstitution, setEduInstitution] = useState("");
  const [eduDescription, setEduDescription] = useState("");
  const [eduDocumentUrl, setEduDocumentUrl] = useState("");
  const [eduDocumentType, setEduDocumentType] = useState("Certificate");
  const [eduUploading, setEduUploading] = useState(false);
  const [eduTypeModalVisible, setEduTypeModalVisible] = useState(false);
  const [editingEduIndex, setEditingEduIndex] = useState<number | null>(null);

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

  const handlePickDocument = async (
    setUrl: (url: string) => void,
    isExperience: boolean = false,
  ) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
      });

      if (!result.canceled && result.assets[0]) {
        const file = result.assets[0];
        setUrl(file.uri);
        console.log("Document selected:", file.name);
      }
    } catch (error) {
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

    if (
      !expCertificateUrl.trim() ||
      !expCertificateName.trim() ||
      !expDescription.trim()
    ) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
      setExpUploading(true);

      // Create FormData for file upload
      const formData = new FormData();

      // Get filename and determine file type
      const filename = expCertificateUrl.split("/").pop() || "certificate.jpg";
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
        uri: expCertificateUrl,
        name: filename,
        type: mimeType,
      } as any);

      // Append other fields as strings
      formData.append("documentName", expCertificateName);
      formData.append("documentType", "Certificate");
      formData.append("description", expDescription);

      console.log("📤 Uploading certificate:", { filename, type: mimeType });

      // Upload using apiUpload instead of apiCall
      const response = await apiUpload(
        api.workers.uploadExperience(user._id),
        formData,
        token!,
      );

      Alert.alert("Success", "Experience document uploaded successfully!");
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
    setExpDescription("");
    setExpCertificateName("");
    setExpCertificateUrl("");
    setShowExpForm(false);
    setEditingExpIndex(null);
    setExpFormMode("add");
  };

  const resetEduForm = () => {
    setEduDocumentName("");
    setEduInstitution("");
    setEduDescription("");
    setEduDocumentUrl("");
    setEduDocumentType("Certificate");
    setShowEduForm(false);
    setEditingEduIndex(null);
    setEduFormMode("add");
  };

  const handleUploadEducationDocument = async () => {
    if (!user?._id) {
      Alert.alert("Error", "User information not loaded. Please try again.");
      return;
    }

    if (
      !eduDocumentUrl.trim() ||
      !eduDocumentName.trim() ||
      !eduDescription.trim()
    ) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    try {
      setEduUploading(true);

      // Create FormData for file upload
      const formData = new FormData();

      // Get filename and determine file type
      const filename = eduDocumentUrl.split("/").pop() || "education.jpg";
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
        uri: eduDocumentUrl,
        name: filename,
        type: mimeType,
      } as any);

      // Append other fields as strings
      formData.append("documentName", eduDocumentName);
      formData.append("institution", eduInstitution);
      formData.append("documentType", eduDocumentType);
      formData.append("description", eduDescription);

      console.log("📤 Uploading education document:", {
        filename,
        type: mimeType,
      });

      // Upload using apiUpload instead of apiCall
      const response = await apiUpload(
        api.workers.uploadEducation(user._id),
        formData,
        token!,
      );

      Alert.alert("Success", "Education document uploaded successfully!");
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
                      {doc.name || "Unnamed Certificate"}
                    </ThemedText>
                    <ThemedText style={styles.experienceDescription}>
                      {doc.description || "No description provided"}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setEditingExpIndex(index);
                      setExpDescription(doc.description || "");
                      setExpCertificateName(doc.name || "");
                      setExpCertificateUrl(doc.url);
                      setExpFormMode("edit");
                      setShowExpForm(true);
                    }}
                  >
                    <Ionicons name="pencil" size={18} color="#0066CC" />
                  </TouchableOpacity>
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
                Add your certificates and training to enhance your profile
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

                {/* Certificate Name */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.formLabel}>
                    Certificate Name *
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
                    Upload Certificate *
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
                        : "Select Certificate"
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
                    disabled={
                      !expCertificateUrl ||
                      !expCertificateName ||
                      !expDescription ||
                      expUploading
                    }
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
                  </View>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => {
                      setEditingEduIndex(index);
                      setEduDocumentName(doc.name || "");
                      setEduInstitution(doc.institution || "");
                      setEduDescription(doc.description || "");
                      setEduDocumentUrl(doc.url);
                      setEduDocumentType(doc.documentType || "Certificate");
                      setEduFormMode("edit");
                      setShowEduForm(true);
                    }}
                  >
                    <Ionicons name="pencil" size={18} color="#0066CC" />
                  </TouchableOpacity>
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
                      !eduDocumentUrl ||
                      !eduDocumentName ||
                      !eduDescription ||
                      eduUploading
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
  editButton: {
    padding: 6,
    marginLeft: 8,
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
