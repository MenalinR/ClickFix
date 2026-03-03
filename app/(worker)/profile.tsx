import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Image,
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

export default function WorkerProfileScreen() {
  const router = useRouter();
  const storeUser = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);

  // State for worker data - initialize from store
  const [user, setUser] = useState({
    id: storeUser?.id || "",
    name: storeUser?.name || "Professional Worker",
    email: storeUser?.email || "email@example.com",
    phone: storeUser?.phone || "+1 (000) 000-0000",
    address: storeUser?.location?.address || "Not provided",
    image: storeUser?.image || "https://via.placeholder.com/150",
    category: storeUser?.category || "Service Professional",
    experience: storeUser?.experience?.toString() || "0",
    hourlyRate: storeUser?.hourlyRate || 0,
    rating: storeUser?.rating || 0,
    reviewCount: storeUser?.reviewCount || 0,
    verified: storeUser?.verified || false,
    nicVerified: storeUser?.nicVerified || false,
    certificates: storeUser?.certificates || [],
  });

  // Update user state when store user changes
  useEffect(() => {
    if (storeUser) {
      console.log("✅ Worker Profile - Store user loaded:", storeUser);
      setUser({
        id: storeUser.id || "",
        name: storeUser.name || "Professional Worker",
        email: storeUser.email || "email@example.com",
        phone: storeUser.phone || "+1 (000) 000-0000",
        address: storeUser.location?.address || "Not provided",
        image: storeUser.image || "https://via.placeholder.com/150",
        category: storeUser.category || "Service Professional",
        experience: storeUser.experience?.toString() || "0",
        hourlyRate: storeUser.hourlyRate || 0,
        rating: storeUser.rating || 0,
        reviewCount: storeUser.reviewCount || 0,
        verified: storeUser.verified || false,
        nicVerified: storeUser.nicVerified || false,
        certificates: storeUser.certificates || [],
      });
    } else {
      console.log("⚠️  Worker Profile - No user data in store");
    }
  }, [storeUser]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const handleSave = () => {
    if (editingField) {
      setUser((prev) => ({ ...prev, [editingField.toLowerCase()]: tempValue }));
      setEditingField(null);
      setTempValue("");
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
    if (!result.canceled) {
      setUser((prev) => ({ ...prev, image: result.assets[0].uri }));
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
          onPress: () =>
            setUser((prev) => ({
              ...prev,
              image: "https://via.placeholder.com/100",
            })),
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
            <TouchableOpacity onPress={handleSave}>
              <Ionicons name="checkmark" size={20} color={Colors.success} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCancel}>
              <Ionicons name="close" size={20} color={Colors.error} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => handleEdit(fieldKey, value)}>
            <Ionicons
              name="pencil-outline"
              size={20}
              color={Colors.textSecondary}
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
          router.replace("/");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={{ padding: 24 }}>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.profileHeader}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: user.image }} style={styles.profileImage} />
            <TouchableOpacity onPress={pickImage} style={styles.editIconBadge}>
              <Ionicons name="pencil" size={12} color="#FFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={removeImage}
              style={styles.removeIconBadge}
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
              <Ionicons
                name="cash-outline"
                size={20}
                color={Colors.primary}
              />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Hourly Rate</Text>
              <Text style={styles.infoValue}>Rs. {user.hourlyRate}</Text>
            </View>
          </View>
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
                <Ionicons name={user.nicVerified ? "checkmark-circle" : "close-circle"} size={14} color={user.nicVerified ? "#4CAF50" : "#F44336"} />{" "}
                {user.nicVerified ? "Verified" : "Pending Verification"}
              </Text>
            </View>
          </View>
        </View>

        {/* Certificates Section */}
        <Text style={styles.sectionTitle}>Certificates</Text>
        {user.certificates.length > 0 ? (
          <View style={styles.certificatesContainer}>
            {user.certificates.map((cert) => (
              <View key={cert.id} style={styles.certificateCard}>
                <View style={styles.certificateIcon}>
                  <Ionicons name="ribbon" size={24} color={Colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.certName}>{cert.name}</Text>
                  <Text style={styles.certIssuer}>
                    {cert.issuer} • {cert.year}
                  </Text>
                </View>
                <TouchableOpacity style={styles.downloadButton}>
                  <Ionicons
                    name="download-outline"
                    size={18}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.addCertButton}>
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.addCertText}>Add Certificate</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              name="ribbon-outline"
              size={40}
              color={Colors.textSecondary}
            />
            <Text style={styles.emptyText}>No certificates added yet</Text>
            <TouchableOpacity style={styles.addCertButton}>
              <Ionicons
                name="add-circle-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.addCertText}>Add Certificate</Text>
            </TouchableOpacity>
          </View>
        )}
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
});
