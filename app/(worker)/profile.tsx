import { Ionicons } from "@expo/vector-icons";
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
import { api, apiCall } from "../../constants/api";

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

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [skillModalVisible, setSkillModalVisible] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [savingSkills, setSavingSkills] = useState(false);
  const [saving, setSaving] = useState(false);

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
        console.log("✅ Worker profile loaded from backend:", {
          image: workerData.image,
          skills: workerData.skills,
          address: workerData.location?.address,
        });
        const updatedUser = mapWorkerToUser(workerData);
        console.log("🔄 Setting user state to:", updatedUser);
        setUser(updatedUser);
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
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="cash-outline" size={20} color={Colors.primary} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Hourly Rate</Text>
              <Text style={styles.infoValue}>Rs. {user.hourlyRate}</Text>
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

        {/* Rating & Reviews Section */}
        <Text style={styles.sectionTitle}>Rating & Reviews</Text>
        <View style={styles.ratingCard}>
          <View style={styles.ratingLeft}>
            <Text style={styles.ratingNumber}>{user.rating}</Text>
            <View style={styles.starsContainer}>
              {[...Array(5)].map((_, i) => (
                <Ionicons
                  key={i}
                  name={i < Math.floor(user.rating) ? "star" : "star-outline"}
                  size={16}
                  color="#FFB800"
                />
              ))}
            </View>
            <Text style={styles.reviewCount}>({user.reviewCount} reviews)</Text>
          </View>
          <View style={styles.ratingRight}>
            <TouchableOpacity style={styles.viewReviewsButton}>
              <Text style={styles.viewReviewsText}>View All Reviews</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={Colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>

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
});
