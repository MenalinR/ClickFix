import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";
import {
  api,
  apiCall,
  apiUpload,
  isPdfUrl,
  resolveMediaUrl,
} from "../../constants/api";

type DatePickerField = "expStart" | "expEnd" | "eduStart" | "eduEnd";

interface WorkerDocument {
  _id?: string;
  title?: string;
  name?: string;
  documentName?: string;
  institution?: string;
  description?: string;
  url: string;
  documentType: string;
  verificationStatus?: "Pending" | "Verified" | "Rejected";
  verificationNotes?: string;
  issueDate?: string;
  expiryDate?: string;
  startDate?: string;
  endDate?: string;
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

function isImageUri(uri: string): boolean {
  if (!uri) return false;
  const lower = uri.toLowerCase().split("?")[0];
  return (
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".webp") ||
    lower.endsWith(".heic")
  );
}

function getFilenameFromUri(uri: string): string {
  if (!uri) return "";
  const segment = uri.split("?")[0].split("/").pop() || "Document";
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

export default function WorkerProfileScreen() {
  const router = useRouter();
  const storeUser = useStore((state) => state.user);
  const token = useStore((state) => state.token);
  const logout = useStore((state) => state.logout);

  // State for worker data - initialize from store
  const [user, setUser] = useState({
    id: storeUser?.id || "",
    name: storeUser?.name || "Professional Worker",
    email: storeUser?.email || "email@example.com",
    phone: storeUser?.phone || "+1 (000) 000-0000",
    address: (storeUser as any)?.location?.address || "Not provided",
    image: (storeUser as any)?.image || "https://via.placeholder.com/150",
    category: (storeUser as any)?.category || "Service Professional",
    experience: (storeUser as any)?.experience?.toString() || "0",
    about: (storeUser as any)?.bio || (storeUser as any)?.about || "",
    hourlyRate: (storeUser as any)?.hourlyRate || 0,
    rating: (storeUser as any)?.rating || 0,
    reviewCount: (storeUser as any)?.reviewCount || 0,
    verified: (storeUser as any)?.verified || false,
    nicVerified: (storeUser as any)?.nicVerified || false,
    certificates: (storeUser as any)?.certificates || [],
    skills: (storeUser as any)?.skills || [],
  });

  const [reviews, setReviews] = useState<any[]>([]);

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [skillModalVisible, setSkillModalVisible] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [savingSkills, setSavingSkills] = useState(false);
  const [saving, setSaving] = useState(false);

  // Experience documents
  const [experienceDocs, setExperienceDocs] = useState<WorkerDocument[]>([]);
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

  // Education documents
  const [educationDocs, setEducationDocs] = useState<WorkerDocument[]>([]);
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

  // Month/Year picker
  const [datePickerTarget, setDatePickerTarget] =
    useState<DatePickerField | null>(null);
  const [datePickerStep, setDatePickerStep] = useState<"month" | "year">(
    "month",
  );
  const YEAR_OPTIONS = getYearOptions();

  // Document picker sheet
  const [docPickerSetUrl, setDocPickerSetUrl] = useState<
    ((url: string) => void) | null
  >(null);

  const mapWorkerToUser = (workerData: any) => ({
    id: workerData._id || workerData.id || user.id,
    name: workerData.name || "Professional Worker",
    email: workerData.email || "email@example.com",
    phone: workerData.phone || "+1 (000) 000-0000",
    address: workerData.location?.address || "Not provided",
    image: workerData.image || "https://via.placeholder.com/150",
    category: workerData.category || "Service Professional",
    experience: workerData.experience?.toString() || "0",
    about: workerData.bio || workerData.about || "",
    hourlyRate: workerData.hourlyRate || 0,
    rating: workerData.rating || 0,
    reviewCount: workerData.reviewCount || 0,
    verified: workerData.verified || false,
    nicVerified: workerData.nicVerified || false,
    certificates: workerData.certificates || [],
    skills: workerData.skills || [],
  });

  // Load worker profile from backend
  const loadWorkerProfile = async () => {
    const workerId = user.id || storeUser?.id || storeUser?._id;
    if (!workerId || !token) {
      console.log("⚠️  Cannot load profile - missing ID or token");
      return;
    }

    try {
      console.log("🔄 Loading worker profile from backend for ID:", workerId);
      const response = await apiCall(
        api.workers.getById(workerId),
        "GET",
        null,
        token,
      );

      if (response.success && response.data) {
        const workerData = response.data;
        const updatedUser = mapWorkerToUser(workerData);
        setUser(updatedUser);
        setExperienceDocs(workerData.experienceDocuments || []);
        setEducationDocs(workerData.educationDocuments || []);

        // Fetch reviews separately
        try {
          const revRes = await apiCall(api.reviews.getByWorker(workerId), "GET", null, token);
          if (revRes?.success) setReviews(revRes.data || []);
        } catch {
          // non-fatal
        }
      }
    } catch (error: any) {
      console.error("❌ Failed to load worker profile:", error);
    }
  };

  // Load profile from backend when user logs in or token changes
  useEffect(() => {
    if (storeUser && token) {
      loadWorkerProfile();
    }
  }, [storeUser?.id, token]);

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const handleSave = async () => {
    if (!editingField || !user.id || !token) return;

    try {
      setSaving(true);
      const fieldKey = editingField.toLowerCase();
      let updateData: any = {};

      // Map frontend fields to backend fields
      if (fieldKey === "phone") {
        updateData.phone = tempValue;
      } else if (fieldKey === "address") {
        // Include proper GeoJSON format for location
        updateData.location = {
          type: "Point",
          coordinates: [0, 0], // Default coordinates (will be updated if we add GPS lookup)
          address: tempValue,
        };
      } else if (fieldKey === "about") {
        updateData.bio = tempValue;
      } else {
        updateData[fieldKey] = tempValue;
      }

      const response = await apiCall(
        api.workers.update(user.id),
        "PUT",
        updateData,
        token,
      );

      setEditingField(null);
      setTempValue("");
      if (response?.data) {
        setUser(mapWorkerToUser(response.data));
      } else {
        setUser((prev) => ({ ...prev, [fieldKey]: tempValue }));
      }
      Alert.alert("Success", "Profile updated successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingField(null);
    setTempValue("");
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });
    if (!result.canceled && user.id && token) {
      const imageUri = result.assets[0].uri;
      try {
        setSaving(true);
        console.log("📷 Starting image upload...");

        // Create FormData to upload the actual image file
        const formData = new FormData();
        const filename = imageUri.split("/").pop() || "profile.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        // @ts-ignore - FormData append accepts files in React Native
        formData.append("document", {
          uri: imageUri,
          name: filename,
          type: type,
        });

        console.log("📤 Uploading to:", api.workers.uploadImage(user.id));

        // Upload image file
        const response = await fetch(api.workers.uploadImage(user.id), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type - let the browser set it with boundary
          },
          body: formData,
        });

        console.log("📥 Upload response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("❌ Upload failed:", response.status, errorText);
          throw new Error(`Upload failed: ${response.status}`);
        }

        const uploadResult = await response.json();
        console.log("✅ Upload successful:", uploadResult);

        if (uploadResult.success && uploadResult.data?.image) {
          setUser((prev) => ({
            ...prev,
            image: uploadResult.data.image,
          }));
          Alert.alert("Success", "Profile picture updated successfully");
        } else {
          throw new Error(uploadResult.message || "Failed to upload image");
        }
      } catch (error: any) {
        console.error("❌ Image upload error:", error);
        Alert.alert(
          "Error",
          error.message || "Failed to update profile picture",
        );
      } finally {
        setSaving(false);
      }
    }
  };

  const removeImage = () => {
    Alert.alert(
      "Remove Photo",
      "Are you sure you want to remove your profile photo?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            if (!user.id || !token) return;
            try {
              setSaving(true);
              const response = await apiCall(
                api.workers.update(user.id),
                "PUT",
                { image: "https://via.placeholder.com/100" },
                token,
              );
              if (response?.data) {
                setUser(mapWorkerToUser(response.data));
              } else {
                setUser((prev) => ({
                  ...prev,
                  image: "https://via.placeholder.com/100",
                }));
              }
              Alert.alert("Success", "Profile picture removed");
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "Failed to remove profile picture",
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  const renderEditableField = (
    label: string,
    fieldKey: string,
    value: string,
  ) => {
    const isEditing = editingField === fieldKey;
    return (
      <View style={styles.infoRow}>
        <View style={styles.iconContainer}>
          <Ionicons
            name={
              label === "Mobile Number"
                ? "call-outline"
                : label === "Email Address"
                  ? "mail-outline"
                  : "location-outline"
            }
            size={20}
            color={Colors.primary}
          />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>{label}</Text>
          {isEditing ? (
            <TextInput
              style={styles.editInput}
              value={tempValue}
              onChangeText={setTempValue}
              autoFocus
            />
          ) : (
            <Text style={styles.infoValue}>{value}</Text>
          )}
        </View>
        {isEditing ? (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              <Ionicons
                name="checkmark"
                size={20}
                color={saving ? Colors.textSecondary : Colors.success}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCancel} disabled={saving}>
              <Ionicons
                name="close"
                size={20}
                color={saving ? Colors.textSecondary : Colors.error}
              />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={() => handleEdit(fieldKey, value)}
            disabled={saving}
          >
            <Ionicons
              name="pencil-outline"
              size={20}
              color={saving ? Colors.textSecondary : Colors.textSecondary}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => {
          logout();
          setTimeout(() => {
            router.dismissAll();
            router.replace("/");
          }, 0);
        },
      },
    ]);
  };

  const handleAddSkill = async () => {
    if (!newSkill.trim()) {
      Alert.alert("Error", "Please enter a skill");
      return;
    }

    if (user.skills.includes(newSkill.trim())) {
      Alert.alert("Error", "This skill is already added");
      return;
    }

    const updatedSkills = [...user.skills, newSkill.trim()];
    await saveSkills(updatedSkills);
    setNewSkill("");
    setSkillModalVisible(false);
  };

  const handleRemoveSkill = async (skillToRemove: string) => {
    Alert.alert("Remove Skill", `Remove "${skillToRemove}" from your skills?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          const updatedSkills = user.skills.filter(
            (skill) => skill !== skillToRemove,
          );
          await saveSkills(updatedSkills);
        },
      },
    ]);
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

  const handlePickDocument = (setUrl: (url: string) => void) => {
    setDocPickerSetUrl(() => setUrl);
  };

  const closeDocPicker = () => setDocPickerSetUrl(null);

  const runDocPickerOption = (
    handler: (setUrl: (url: string) => void) => Promise<void> | void,
  ) => {
    const setUrl = docPickerSetUrl;
    closeDocPicker();
    if (setUrl) handler(setUrl);
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

  const handleSaveExperience = async () => {
    if (!user.id || !token) {
      Alert.alert("Error", "Please login again");
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

      if (expCertificateUrl.trim() && isLocalFileUri(expCertificateUrl)) {
        const filename = expCertificateUrl.split("/").pop() || "certificate.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const extension = match ? match[1] : "jpg";

        let mimeType = "image/jpeg";
        if (extension === "pdf") mimeType = "application/pdf";
        else if (extension === "png") mimeType = "image/png";
        else if (extension === "jpg" || extension === "jpeg")
          mimeType = "image/jpeg";

        formData.append("document", {
          uri: expCertificateUrl,
          name: filename,
          type: mimeType,
        } as any);
      }

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

      await apiUpload(
        expFormMode === "edit" && editingExpId
          ? api.workers.updateExperience(user.id, editingExpId)
          : api.workers.uploadExperience(user.id),
        formData,
        token,
        expFormMode === "edit" ? "PUT" : "POST",
      );

      Alert.alert(
        "Success",
        expFormMode === "edit"
          ? "Experience updated successfully!"
          : "Experience saved successfully!",
      );
      resetExpForm();
      loadWorkerProfile();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setExpUploading(false);
    }
  };

  const handleSaveEducation = async () => {
    if (!user.id || !token) {
      Alert.alert("Error", "Please login again");
      return;
    }
    if (!eduDocumentName.trim()) {
      Alert.alert("Error", "Please enter a degree or certificate name");
      return;
    }
    if (eduFormMode !== "edit" && !eduDocumentUrl.trim()) {
      Alert.alert("Error", "Please upload a document file");
      return;
    }

    try {
      setEduUploading(true);
      const formData = new FormData();

      if (eduDocumentUrl.trim() && isLocalFileUri(eduDocumentUrl)) {
        const filename = eduDocumentUrl.split("/").pop() || "education.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const extension = match ? match[1] : "jpg";

        let mimeType = "image/jpeg";
        if (extension === "pdf") mimeType = "application/pdf";
        else if (extension === "png") mimeType = "image/png";
        else if (extension === "jpg" || extension === "jpeg")
          mimeType = "image/jpeg";

        formData.append("document", {
          uri: eduDocumentUrl,
          name: filename,
          type: mimeType,
        } as any);
      }

      formData.append("documentName", eduDocumentName);
      formData.append("institution", eduInstitution);
      formData.append("documentType", eduDocumentType);
      formData.append("description", eduDescription);
      const eduStart = monthYearToIso(eduStartMonth, eduStartYear);
      const eduEnd = monthYearToIso(eduEndMonth, eduEndYear);
      if (eduStart) formData.append("startDate", eduStart);
      if (eduEnd) formData.append("endDate", eduEnd);

      await apiUpload(
        eduFormMode === "edit" && editingEduId
          ? api.workers.updateEducation(user.id, editingEduId)
          : api.workers.uploadEducation(user.id),
        formData,
        token,
        eduFormMode === "edit" ? "PUT" : "POST",
      );

      Alert.alert(
        "Success",
        eduFormMode === "edit"
          ? "Education updated successfully!"
          : "Education document uploaded successfully!",
      );
      resetEduForm();
      loadWorkerProfile();
    } catch (error: any) {
      Alert.alert("Error", error.message);
    } finally {
      setEduUploading(false);
    }
  };

  const handleDeleteExperience = (doc: WorkerDocument) => {
    if (!user.id || !token || !doc._id) return;
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
                api.workers.deleteExperience(user.id, doc._id!),
                "DELETE",
                undefined,
                token,
              );
              Alert.alert("Success", "Experience deleted successfully.");
              loadWorkerProfile();
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

  const handleDeleteEducation = (doc: WorkerDocument) => {
    if (!user.id || !token || !doc._id) return;
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
                api.workers.deleteEducation(user.id, doc._id!),
                "DELETE",
                undefined,
                token,
              );
              Alert.alert("Success", "Education deleted successfully.");
              loadWorkerProfile();
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

  const openExperienceEditor = (doc: WorkerDocument) => {
    setEditingExpId(doc._id || null);
    setExpTitle(doc.title || doc.name || doc.description || "");
    setExpDescription(doc.description || "");
    setExpCertificateName(doc.name || "");
    setExpCertificateUrl(doc.url || "");
    const start = isoToMonthYear(doc.issueDate);
    const end = isoToMonthYear(doc.expiryDate);
    setExpStartMonth(start.month);
    setExpStartYear(start.year);
    setExpEndMonth(end.month);
    setExpEndYear(end.year);
    setExpFormMode("edit");
    setShowExpForm(true);
  };

  const openEducationEditor = (doc: WorkerDocument) => {
    setEditingEduId(doc._id || null);
    setEduDocumentName(doc.name || "");
    setEduInstitution(doc.institution || "");
    setEduDescription(doc.description || "");
    setEduDocumentUrl(doc.url || "");
    setEduDocumentType(doc.documentType || "Certificate");
    const start = isoToMonthYear(doc.startDate);
    const end = isoToMonthYear(doc.endDate);
    setEduStartMonth(start.month);
    setEduStartYear(start.year);
    setEduEndMonth(end.month);
    setEduEndYear(end.year);
    setEduFormMode("edit");
    setShowEduForm(true);
  };

  const saveSkills = async (skills: string[]) => {
    if (!user.id || !token) {
      Alert.alert("Error", "Please login again");
      return;
    }

    try {
      setSavingSkills(true);
      await apiCall(api.workers.update(user.id), "PUT", { skills }, token);
      setUser((prev) => ({ ...prev, skills }));
      Alert.alert("Success", "Skills updated successfully");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to update skills");
    } finally {
      setSavingSkills(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.profileHeader}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: user.image }} style={styles.profileImage} />
            <TouchableOpacity
              onPress={pickImage}
              style={styles.editIconBadge}
              disabled={saving}
            >
              <Ionicons name="pencil" size={12} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={removeImage}
              style={styles.removeIconBadge}
              disabled={saving}
            >
              <Ionicons name="trash-outline" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            {editingField === "name" ? (
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
              >
                <TextInput
                  style={[
                    styles.editInput,
                    { fontSize: 20, width: 200, textAlign: "center" },
                  ]}
                  value={tempValue}
                  onChangeText={setTempValue}
                  autoFocus
                />
                <TouchableOpacity onPress={handleSave}>
                  <Ionicons name="checkmark" size={20} color={Colors.success} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancel}>
                  <Ionicons name="close" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.profileName}>{user.name}</Text>
                <TouchableOpacity onPress={() => handleEdit("name", user.name)}>
                  <Ionicons name="pencil" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </>
            )}
          </View>
          <Text style={styles.profileRole}>{user.category}</Text>
        </View>
        <View style={styles.infoSection}>
          {renderEditableField("Mobile Number", "phone", user.phone)}
          {renderEditableField("Email Address", "email", user.email)}
          {renderEditableField("Address", "address", user.address)}
        </View>

        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.infoSection}>
          {editingField === "about" ? (
            <>
              <TextInput
                style={styles.aboutInput}
                value={tempValue}
                onChangeText={setTempValue}
                placeholder="Tell customers about your experience and expertise"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                autoFocus
              />
              <View style={styles.aboutActions}>
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={saving ? Colors.textSecondary : Colors.success}
                  />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancel} disabled={saving}>
                  <Ionicons
                    name="close"
                    size={20}
                    color={saving ? Colors.textSecondary : Colors.error}
                  />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <View style={styles.aboutViewRow}>
              <Text style={styles.aboutValue}>
                {user.about || "No description added yet"}
              </Text>
              <TouchableOpacity
                onPress={() => handleEdit("about", user.about || "")}
                disabled={saving}
              >
                <Ionicons
                  name="pencil-outline"
                  size={20}
                  color={saving ? Colors.textSecondary : Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Professional Details Section */}
        <Text style={styles.sectionTitle}>Professional Details</Text>
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="hammer-outline"
                size={20}
                color={Colors.primary}
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Skill Category</Text>
              <Text style={styles.infoValue}>{user.category}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons
                name="briefcase-outline"
                size={20}
                color={Colors.primary}
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Experience (Years)</Text>
              <Text style={styles.infoValue}>{user.experience}</Text>
            </View>
          </View>
        </View>

        {/* Skills Section */}
        <Text style={styles.sectionTitle}>Skills & Expertise</Text>
        <View style={styles.skillsContainer}>
          {user.skills.length > 0 ? (
            <View style={styles.skillsGrid}>
              {user.skills.map((skill, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{skill}</Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveSkill(skill)}
                    disabled={savingSkills}
                    style={styles.skillRemoveButton}
                  >
                    <Ionicons name="close-circle" size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptySkillsState}>
              <Ionicons
                name="construct-outline"
                size={32}
                color={Colors.textSecondary}
              />
              <Text style={styles.emptyText}>No skills added yet</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.addSkillButton}
            onPress={() => setSkillModalVisible(true)}
            disabled={savingSkills}
          >
            <Ionicons
              name="add-circle-outline"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.addSkillText}>Add Skill</Text>
          </TouchableOpacity>
        </View>

        {/* Experience Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Experience</Text>
          <TouchableOpacity
            style={styles.sectionAddButton}
            onPress={() => {
              setExpFormMode("add");
              setShowExpForm(true);
            }}
          >
            <Ionicons name="add-circle" size={28} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.experienceContainer}>
          {experienceDocs.length > 0 ? (
            experienceDocs.map((doc, index) => (
              <View key={doc._id || index} style={styles.experienceCard}>
                <View style={styles.experienceHeader}>
                  <View style={styles.experienceInfo}>
                    <Text style={styles.experienceTitle}>
                      {doc.title || doc.name || doc.description || "Experience"}
                    </Text>
                    <Text style={styles.experienceDescription}>
                      {doc.description || "No description provided"}
                    </Text>
                    {(doc.issueDate || doc.expiryDate) && (
                      <Text style={styles.dateRangeText}>
                        {formatRangeWithPresent(doc.issueDate, doc.expiryDate)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.experienceActions}>
                    <TouchableOpacity
                      onPress={() => openExperienceEditor(doc)}
                      style={styles.iconActionButton}
                    >
                      <Ionicons name="pencil" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteExperience(doc)}
                      style={styles.iconActionButton}
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
                    {isPdfUrl(doc.url) ? (
                      <View style={styles.certificateThumbnail}>
                        <Ionicons
                          name="document-text"
                          size={28}
                          color={Colors.primary}
                        />
                      </View>
                    ) : (
                      <Image
                        source={{ uri: resolveMediaUrl(doc.url) }}
                        style={styles.certificateThumbnail}
                      />
                    )}
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.experienceEmpty}>
              <Ionicons name="briefcase" size={48} color="#9CA3AF" />
              <Text style={styles.experienceEmptyText}>
                No experience added yet
              </Text>
              <Text style={styles.experienceEmptySubtext}>
                Add your work experience. Certificates are optional.
              </Text>
            </View>
          )}
        </View>

        {/* Education Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Education</Text>
          <TouchableOpacity
            style={styles.sectionAddButton}
            onPress={() => {
              setEduFormMode("add");
              setShowEduForm(true);
            }}
          >
            <Ionicons name="add-circle" size={28} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={styles.experienceContainer}>
          {educationDocs.length > 0 ? (
            educationDocs.map((doc, index) => (
              <View key={doc._id || index} style={styles.experienceCard}>
                <View style={styles.experienceHeader}>
                  <View style={styles.experienceInfo}>
                    <Text style={styles.experienceTitle}>
                      {doc.name || "Unnamed Education"}
                    </Text>
                    {!!doc.institution && (
                      <Text style={styles.institutionText}>
                        {doc.institution}
                      </Text>
                    )}
                    <Text style={styles.experienceDescription}>
                      {doc.description || "No description provided"}
                    </Text>
                    {(doc.startDate || doc.endDate) && (
                      <Text style={styles.dateRangeText}>
                        {formatRangeWithPresent(doc.startDate, doc.endDate)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.experienceActions}>
                    <TouchableOpacity
                      onPress={() => openEducationEditor(doc)}
                      style={styles.iconActionButton}
                    >
                      <Ionicons name="pencil" size={18} color={Colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeleteEducation(doc)}
                      style={styles.iconActionButton}
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
                    {isPdfUrl(doc.url) ? (
                      <View style={styles.certificateThumbnail}>
                        <Ionicons
                          name="document-text"
                          size={28}
                          color={Colors.primary}
                        />
                      </View>
                    ) : (
                      <Image
                        source={{ uri: resolveMediaUrl(doc.url) }}
                        style={styles.certificateThumbnail}
                      />
                    )}
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.experienceEmpty}>
              <Ionicons name="school" size={48} color="#9CA3AF" />
              <Text style={styles.experienceEmptyText}>
                No education added yet
              </Text>
              <Text style={styles.experienceEmptySubtext}>
                Add your degrees, diplomas, and certificates
              </Text>
            </View>
          )}
        </View>

        {/* Rating & Reviews Section */}
        {(() => {
          const avgRating =
            reviews.length > 0
              ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length
              : 0;
          return (
            <>
              <Text style={styles.sectionTitle}>Rating & Reviews</Text>
              <View style={styles.ratingCard}>
                <View style={styles.ratingLeft}>
                  <Text style={styles.ratingNumber}>
                    {avgRating > 0 ? avgRating.toFixed(1) : "0"}
                  </Text>
                  <View style={styles.starsContainer}>
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Ionicons
                        key={i}
                        name={i <= Math.round(avgRating) ? "star" : "star-outline"}
                        size={16}
                        color="#FFB800"
                      />
                    ))}
                  </View>
                  <Text style={styles.reviewCount}>({reviews.length} {reviews.length === 1 ? "review" : "reviews"})</Text>
                </View>
              </View>
            </>
          );
        })()}

        {reviews.length > 0 ? (
          reviews.slice(0, 5).map((r: any) => (
            <View key={r._id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons
                      key={s}
                      name={s <= r.rating ? "star" : "star-outline"}
                      size={13}
                      color="#FFB800"
                    />
                  ))}
                </View>
                <Text style={styles.reviewDate}>
                  {new Date(r.createdAt).toLocaleDateString("en-GB", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </Text>
              </View>
              <Text style={styles.reviewCustomer}>
                {r.customerId?.name || "Customer"}
              </Text>
              {!!r.comment && (
                <Text style={styles.reviewComment}>{r.comment}</Text>
              )}
            </View>
          ))
        ) : (
          <View style={styles.reviewEmpty}>
            <Ionicons name="star-outline" size={32} color={Colors.border} />
            <Text style={styles.reviewEmptyText}>No reviews yet</Text>
          </View>
        )}

        {/* Verification Status Section */}
        <Text style={styles.sectionTitle}>Verification Status</Text>
        <View style={styles.verificationCard}>
          <View style={styles.verificationItem}>
            <View style={[styles.statusIcon, { backgroundColor: "#E8F5E9" }]}>
              <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.verificationTitle}>
                NIC / ID Verification
              </Text>
              <Text style={styles.verificationStatus}>
                <Ionicons
                  name={user.nicVerified ? "checkmark-circle" : "close-circle"}
                  size={14}
                  color={user.nicVerified ? "#4CAF50" : "#F44336"}
                />{" "}
                {user.nicVerified ? "Verified" : "Pending Verification"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.actions}>
          <Button
            title="Logout"
            onPress={handleLogout}
            variant="ghost"
            style={{ borderColor: Colors.error, borderWidth: 1 }}
            textStyle={{ color: Colors.error }}
          />
        </View>
      </ScrollView>

      {/* Experience Form Modal */}
      <Modal
        visible={showExpForm}
        transparent
        animationType="slide"
        onRequestClose={resetExpForm}
      >
        <View style={styles.formModalContainer}>
          <View style={styles.formModalContent}>
            <View style={styles.formModalHeader}>
              <Text style={styles.formModalTitle}>
                {expFormMode === "add" ? "Add Experience" : "Edit Experience"}
              </Text>
              <TouchableOpacity onPress={resetExpForm}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.formModalScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Experience Title *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., HVAC Technician"
                  placeholderTextColor="#9CA3AF"
                  value={expTitle}
                  onChangeText={setExpTitle}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Experience Description *</Text>
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
              <TouchableOpacity
                style={styles.dateInputWrapper}
                activeOpacity={0.8}
                onPress={() => openDatePicker("expStart")}
              >
                <Text style={styles.dateInputLabel}>Start date*</Text>
                <View style={styles.dateInputField}>
                  <Text
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
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={24}
                    color="#1F2937"
                  />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateInputWrapper}
                activeOpacity={0.8}
                onPress={() => openDatePicker("expEnd")}
              >
                <Text style={styles.dateInputLabel}>End date*</Text>
                <View style={styles.dateInputField}>
                  <Text
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
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={24}
                    color="#1F2937"
                  />
                </View>
              </TouchableOpacity>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Certificate Name (Optional)
                </Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., HVAC Technician Certification"
                  placeholderTextColor="#9CA3AF"
                  value={expCertificateName}
                  onChangeText={setExpCertificateName}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>
                  Upload Certificate (Optional)
                </Text>
                {expCertificateUrl ? (
                  <View style={styles.documentPreviewCard}>
                    {isImageUri(expCertificateUrl) ? (
                      <Image
                        source={{ uri: expCertificateUrl }}
                        style={styles.documentPreviewImage}
                      />
                    ) : (
                      <View style={styles.documentPreviewFile}>
                        <Ionicons
                          name="document-text"
                          size={36}
                          color={Colors.primary}
                        />
                        <Text
                          style={styles.documentPreviewFileName}
                          numberOfLines={1}
                        >
                          {getFilenameFromUri(expCertificateUrl)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.documentPreviewActions}>
                      <TouchableOpacity
                        style={styles.documentPreviewBtn}
                        onPress={() => handlePickDocument(setExpCertificateUrl)}
                      >
                        <Ionicons
                          name="swap-horizontal"
                          size={16}
                          color={Colors.primary}
                        />
                        <Text style={styles.documentPreviewBtnText}>
                          Replace
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.documentPreviewBtn}
                        onPress={() => setExpCertificateUrl("")}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#EF4444"
                        />
                        <Text
                          style={[
                            styles.documentPreviewBtnText,
                            { color: "#EF4444" },
                          ]}
                        >
                          Remove
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Button
                    title="Select Certificate (Optional)"
                    onPress={() => handlePickDocument(setExpCertificateUrl)}
                    variant="secondary"
                  />
                )}
              </View>
              <View style={styles.formActions}>
                <Button
                  title={expUploading ? "Saving..." : "Save Experience"}
                  onPress={handleSaveExperience}
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

      {/* Education Form Modal */}
      <Modal
        visible={showEduForm}
        transparent
        animationType="slide"
        onRequestClose={resetEduForm}
      >
        <View style={styles.formModalContainer}>
          <View style={styles.formModalContent}>
            <View style={styles.formModalHeader}>
              <Text style={styles.formModalTitle}>
                {eduFormMode === "add" ? "Add Education" : "Edit Education"}
              </Text>
              <TouchableOpacity onPress={resetEduForm}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.formModalScroll}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Degree/Certificate Name *</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., Bachelor of Engineering"
                  placeholderTextColor="#9CA3AF"
                  value={eduDocumentName}
                  onChangeText={setEduDocumentName}
                />
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Institution Name</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder="e.g., University of Colombo"
                  placeholderTextColor="#9CA3AF"
                  value={eduInstitution}
                  onChangeText={setEduInstitution}
                />
              </View>
              <TouchableOpacity
                style={styles.dateInputWrapper}
                activeOpacity={0.8}
                onPress={() => openDatePicker("eduStart")}
              >
                <Text style={styles.dateInputLabel}>Start date*</Text>
                <View style={styles.dateInputField}>
                  <Text
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
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={24}
                    color="#1F2937"
                  />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateInputWrapper}
                activeOpacity={0.8}
                onPress={() => openDatePicker("eduEnd")}
              >
                <Text style={styles.dateInputLabel}>End date*</Text>
                <View style={styles.dateInputField}>
                  <Text
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
                  </Text>
                  <Ionicons
                    name="calendar-outline"
                    size={24}
                    color="#1F2937"
                  />
                </View>
              </TouchableOpacity>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Document Type *</Text>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setEduTypeModalVisible(true)}
                >
                  <Text style={styles.dropdownText}>{eduDocumentType}</Text>
                  <Ionicons name="chevron-down" size={20} color={Colors.primary} />
                </TouchableOpacity>
              </View>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
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
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Upload Document *</Text>
                {eduDocumentUrl ? (
                  <View style={styles.documentPreviewCard}>
                    {isImageUri(eduDocumentUrl) ? (
                      <Image
                        source={{ uri: eduDocumentUrl }}
                        style={styles.documentPreviewImage}
                      />
                    ) : (
                      <View style={styles.documentPreviewFile}>
                        <Ionicons
                          name="document-text"
                          size={36}
                          color={Colors.primary}
                        />
                        <Text
                          style={styles.documentPreviewFileName}
                          numberOfLines={1}
                        >
                          {getFilenameFromUri(eduDocumentUrl)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.documentPreviewActions}>
                      <TouchableOpacity
                        style={styles.documentPreviewBtn}
                        onPress={() => handlePickDocument(setEduDocumentUrl)}
                      >
                        <Ionicons
                          name="swap-horizontal"
                          size={16}
                          color={Colors.primary}
                        />
                        <Text style={styles.documentPreviewBtnText}>
                          Replace
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.documentPreviewBtn}
                        onPress={() => setEduDocumentUrl("")}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={16}
                          color="#EF4444"
                        />
                        <Text
                          style={[
                            styles.documentPreviewBtnText,
                            { color: "#EF4444" },
                          ]}
                        >
                          Remove
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Button
                    title="Select Document"
                    onPress={() => handlePickDocument(setEduDocumentUrl)}
                    variant="secondary"
                  />
                )}
              </View>
              <View style={styles.formActions}>
                <Button
                  title={eduUploading ? "Saving..." : "Save Education"}
                  onPress={handleSaveEducation}
                  disabled={
                    !eduDocumentName || eduUploading
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
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setEduTypeModalVisible(false)}
        >
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Select Document Type</Text>
            {["Degree", "Diploma", "Certificate", "Other"].map((type) => (
              <TouchableOpacity
                key={type}
                style={styles.pickerOption}
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
                  color={Colors.primary}
                />
                <Text style={styles.pickerOptionText}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Document Source Picker Sheet */}
      <Modal
        transparent
        visible={!!docPickerSetUrl}
        animationType="fade"
        onRequestClose={closeDocPicker}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={closeDocPicker}
        >
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Select document</Text>
            <TouchableOpacity
              style={styles.docPickerOption}
              onPress={() => runDocPickerOption(pickFromGallery)}
            >
              <Ionicons name="image-outline" size={22} color={Colors.primary} />
              <Text style={styles.docPickerOptionText}>Choose from Photos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.docPickerOption}
              onPress={() => runDocPickerOption(pickPdf)}
            >
              <Ionicons
                name="document-outline"
                size={22}
                color={Colors.primary}
              />
              <Text style={styles.docPickerOptionText}>Pick PDF / File</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.docPickerOption, styles.docPickerCancel]}
              onPress={closeDocPicker}
            >
              <Text style={styles.docPickerCancelText}>Cancel</Text>
            </TouchableOpacity>
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
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={closeDatePicker}
        >
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>
              {datePickerStep === "month" ? "Select Month" : "Select Year"}
            </Text>
            {(datePickerTarget === "expEnd" ||
              datePickerTarget === "eduEnd") && (
              <TouchableOpacity
                style={styles.presentOption}
                onPress={setEndDateAsPresent}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={20}
                  color={Colors.primary}
                />
                <Text style={styles.presentOptionText}>Set as Present</Text>
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
                      style={styles.pickerOption}
                      onPress={() => handleMonthSelect(idx + 1)}
                    >
                      <Text style={styles.pickerOptionText}>{name}</Text>
                    </TouchableOpacity>
                  ))
                : YEAR_OPTIONS.map((year) => (
                    <TouchableOpacity
                      key={year}
                      style={styles.pickerOption}
                      onPress={() => handleYearSelect(year)}
                    >
                      <Text style={styles.pickerOptionText}>{String(year)}</Text>
                    </TouchableOpacity>
                  ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Add Skill Modal */}
      <Modal
        visible={skillModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setSkillModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Skill</Text>
              <TouchableOpacity
                onPress={() => {
                  setSkillModalVisible(false);
                  setNewSkill("");
                }}
              >
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.skillInput}
              placeholder="Enter skill (e.g., Pipe Installation, Wiring, etc.)"
              value={newSkill}
              onChangeText={setNewSkill}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setSkillModalVisible(false);
                  setNewSkill("");
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addButton]}
                onPress={handleAddSkill}
                disabled={savingSkills}
              >
                <Text style={styles.addButtonText}>
                  {savingSkills ? "Adding..." : "Add Skill"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerTitle: { fontSize: 24, fontFamily: "Inter_700Bold", marginBottom: 24 },
  profileHeader: { alignItems: "center", marginBottom: 32 },
  imageContainer: { position: "relative", marginBottom: 16 },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  editIconBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.white,
    zIndex: 10,
  },
  removeIconBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.error,
    padding: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.white,
    zIndex: 10,
  },
  profileName: { fontSize: 20, fontFamily: "Inter_600SemiBold" },
  profileRole: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  infoSection: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
    marginHorizontal: -16,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(15, 76, 117, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  infoContent: { flex: 1 },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 4,
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: "500",
  },
  editInput: {
    fontSize: 16,
    color: Colors.text,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
    paddingVertical: 4,
  },
  aboutInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 100,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.background,
  },
  aboutActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 14,
    marginTop: 10,
  },
  aboutViewRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  aboutValue: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    lineHeight: 20,
  },
  ratingCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ratingLeft: {
    alignItems: "center",
    flex: 1,
  },
  ratingNumber: {
    fontSize: 32,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 4,
  },
  starsContainer: {
    flexDirection: "row",
    gap: 4,
    marginBottom: 8,
  },
  reviewCount: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  ratingRight: {
    flex: 1,
    alignItems: "flex-end",
  },
  viewReviewsButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.lightBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewReviewsText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },
  verificationCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  verificationItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  statusIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  verificationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  verificationStatus: {
    fontSize: 13,
    color: "#4CAF50",
    fontWeight: "500",
  },
  certificatesContainer: {
    marginBottom: 24,
  },
  certificateCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  certificateIcon: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: Colors.lightBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  certName: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 2,
  },
  certIssuer: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  downloadButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.lightBackground,
  },
  addCertButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.lightBackground,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: "dashed",
  },
  addCertText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
    marginBottom: 16,
  },
  actions: {
    marginTop: 16,
    marginBottom: 24,
  },
  skillsContainer: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  skillsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  skillChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.lightBackground,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.primary,
    gap: 6,
  },
  skillText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "500",
  },
  skillRemoveButton: {
    padding: 2,
  },
  emptySkillsState: {
    alignItems: "center",
    paddingVertical: 24,
  },
  addSkillButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.lightBackground,
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    marginTop: 8,
  },
  addSkillText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    width: "100%",
    maxWidth: 400,
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
  skillInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: Colors.lightBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.text,
    fontWeight: "600",
    fontSize: 14,
  },
  addButton: {
    backgroundColor: Colors.primary,
  },
  addButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
  },
  sectionAddButton: {
    padding: 4,
  },
  experienceContainer: {
    marginBottom: 8,
  },
  experienceCard: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  experienceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  experienceInfo: {
    flex: 1,
  },
  experienceTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    color: Colors.text,
  },
  institutionText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.primary,
    marginBottom: 4,
  },
  experienceDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  dateRangeText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  experienceActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  iconActionButton: {
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
  experienceEmpty: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    opacity: 0.7,
  },
  experienceEmptyText: {
    marginTop: 8,
    fontSize: 14,
    color: Colors.textSecondary,
  },
  experienceEmptySubtext: {
    marginTop: 4,
    fontSize: 12,
    color: Colors.textSecondary,
    opacity: 0.8,
  },
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
    color: Colors.text,
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
    color: Colors.text,
  },
  formInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: "System",
    color: Colors.text,
  },
  dateInputWrapper: {
    marginBottom: 24,
  },
  dateInputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
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
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#F9FAFB",
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
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
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  pickerSheet: {
    backgroundColor: "white",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 20,
    maxHeight: "70%",
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
    textAlign: "center",
    color: Colors.text,
  },
  pickerOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#E5E7EB",
    gap: 12,
  },
  pickerOptionText: {
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text,
    flex: 1,
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
    color: Colors.primary,
  },
  documentPreviewCard: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: Colors.white,
    overflow: "hidden",
  },
  documentPreviewImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
    backgroundColor: "#F3F4F6",
  },
  documentPreviewFile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 18,
    backgroundColor: "#F9FAFB",
  },
  documentPreviewFileName: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
    fontWeight: "500",
  },
  documentPreviewActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  documentPreviewBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  documentPreviewBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  docPickerOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  docPickerOptionText: {
    fontSize: 15,
    fontWeight: "500",
    color: Colors.text,
  },
  docPickerCancel: {
    justifyContent: "center",
    borderBottomWidth: 0,
    marginTop: 6,
  },
  docPickerCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.error,
  },
  reviewCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  reviewStars: { flexDirection: "row", gap: 2 },
  reviewDate: { fontSize: 11, color: Colors.textSecondary },
  reviewCustomer: { fontSize: 13, fontWeight: "600", color: Colors.text, marginBottom: 4 },
  reviewComment: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  reviewEmpty: {
    alignItems: "center",
    paddingVertical: 24,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  reviewEmptyText: { fontSize: 13, color: Colors.textSecondary, marginTop: 8 },
});
