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
import { Button } from "../../../components/Button";
import { Colors } from "../../../constants/Colors";
import { useStore } from "../../../constants/Store";
import { api, apiCall } from "../../../constants/api";

export default function ProfileScreen() {
  const router = useRouter();
  const {
    user: currentUser,
    token,
    setUser: setStoreUser,
    logout,
  } = useStore();

  // State for user data
  const [user, setUser] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    mobile: currentUser?.phone || "",
    address:
      (currentUser as any)?.addresses?.[
        ((currentUser as any)?.addresses?.length || 1) - 1
      ]?.address || "Not provided",
    image: (currentUser as any)?.image || "https://via.placeholder.com/150",
  });

  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState("");
  const [saving, setSaving] = useState(false);

  const customerId = currentUser?._id || currentUser?.id;

  useEffect(() => {
    if (!currentUser) return;

    const addresses = ((currentUser as any)?.addresses || []) as any[];
    const latestAddress = addresses.length
      ? addresses[addresses.length - 1]
      : null;

    setUser((prev) => ({
      ...prev,
      name: currentUser.name || "",
      email: currentUser.email || "",
      mobile: currentUser.phone || "",
      address: latestAddress?.address || latestAddress?.street || prev.address,
      image: (currentUser as any).image || prev.image,
    }));
  }, [currentUser]);

  useEffect(() => {
    const loadCustomerProfile = async () => {
      if (!customerId || !token) return;
      try {
        const response = await apiCall(
          api.customers.getById(customerId),
          "GET",
          undefined,
          token,
        );

        const profile = response.data;
        const addresses = (profile?.addresses || []) as any[];
        const latestAddress = addresses.length
          ? addresses[addresses.length - 1]
          : null;

        setUser((prev) => ({
          ...prev,
          name: profile?.name || prev.name,
          email: profile?.email || prev.email,
          mobile: profile?.phone || prev.mobile,
          address:
            latestAddress?.address || latestAddress?.street || prev.address,
          image: profile?.image || prev.image,
        }));

        setStoreUser({
          ...currentUser!,
          name: profile?.name || currentUser!.name,
          email: profile?.email || currentUser!.email,
          phone: profile?.phone || currentUser!.phone,
          image: profile?.image || (currentUser as any)?.image,
          addresses: addresses,
        } as any);
      } catch (error) {
        console.error("Failed to load customer profile:", error);
      }
    };

    loadCustomerProfile();
  }, [customerId, token]);

  const handleEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue);
  };

  const handleSave = async () => {
    if (!editingField) return;
    if (!customerId || !token) {
      Alert.alert("Error", "Please login again");
      return;
    }

    try {
      setSaving(true);

      if (editingField === "name") {
        const response = await apiCall(
          api.customers.update(customerId),
          "PUT",
          { name: tempValue },
          token,
        );

        setUser((prev) => ({
          ...prev,
          name: response.data?.name || tempValue,
        }));
        setStoreUser({
          ...currentUser!,
          name: response.data?.name || tempValue,
          phone: response.data?.phone || currentUser!.phone,
        });
      } else if (editingField === "mobile") {
        const response = await apiCall(
          api.customers.update(customerId),
          "PUT",
          { phone: tempValue },
          token,
        );

        setUser((prev) => ({
          ...prev,
          mobile: response.data?.phone || tempValue,
        }));
        setStoreUser({
          ...currentUser!,
          name: response.data?.name || currentUser!.name,
          phone: response.data?.phone || tempValue,
        });
      } else if (editingField === "address") {
        const response = await apiCall(
          api.customers.addAddress(customerId),
          "POST",
          {
            label: "Home",
            address: tempValue,
            city: "",
            state: "",
            zipCode: "",
          },
          token,
        );

        const addresses = (response?.data?.addresses || []) as any[];
        const latestAddress = addresses.length
          ? addresses[addresses.length - 1]
          : null;
        const savedAddress =
          latestAddress?.address || latestAddress?.street || tempValue;

        setUser((prev) => ({ ...prev, address: savedAddress }));
        setStoreUser({
          ...currentUser!,
          addresses,
        } as any);
      } else if (editingField === "email") {
        Alert.alert("Info", "Email update is not supported right now.");
      }

      setEditingField(null);
      setTempValue("");
    } catch (error: any) {
      Alert.alert("Update Failed", error.message || "Could not save changes");
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

    if (!result.canceled && customerId && token) {
      const imageUri = result.assets[0].uri;

      try {
        setSaving(true);

        const formData = new FormData();
        const filename = imageUri.split("/").pop() || "profile.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        // @ts-ignore - React Native FormData file type
        formData.append("document", {
          uri: imageUri,
          name: filename,
          type,
        });

        const response = await fetch(api.customers.uploadImage(customerId), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          let errorMessage = `Upload failed: ${response.status}`;
          try {
            const errorResult = await response.json();
            errorMessage = errorResult?.message || errorMessage;
          } catch {
            const errorText = await response.text();
            if (errorText) errorMessage = errorText;
          }
          throw new Error(errorMessage);
        }

        const uploadResult = await response.json();
        const newImage = uploadResult?.data?.image;

        if (!newImage) {
          throw new Error("Failed to upload profile image");
        }

        setUser((prev) => ({ ...prev, image: newImage }));
        setStoreUser({
          ...currentUser!,
          image: newImage,
        } as any);
        Alert.alert("Success", "Profile picture updated successfully");
      } catch (error: any) {
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
            if (!customerId || !token) return;
            try {
              setSaving(true);
              await apiCall(
                api.customers.update(customerId),
                "PUT",
                { image: "https://via.placeholder.com/150" },
                token,
              );
              setUser((prev) => ({
                ...prev,
                image: "https://via.placeholder.com/150",
              }));
              setStoreUser({
                ...currentUser!,
                image: "https://via.placeholder.com/150",
              } as any);
            } catch (error: any) {
              Alert.alert(
                "Error",
                error.message || "Failed to remove profile photo",
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
            <TouchableOpacity onPress={handleSave}>
              <Ionicons name="checkmark" size={20} color={Colors.success} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCancel}>
              <Ionicons name="close" size={20} color={Colors.error} />
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
          setTimeout(() => {
            router.dismissAll();
            router.replace("/");
          }, 0);
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
                <TouchableOpacity onPress={handleSave} disabled={saving}>
                  <Ionicons name="checkmark" size={20} color={Colors.success} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleCancel} disabled={saving}>
                  <Ionicons name="close" size={20} color={Colors.error} />
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.profileName}>{user.name}</Text>
                <TouchableOpacity
                  onPress={() => handleEdit("name", user.name)}
                  disabled={saving}
                >
                  <Ionicons name="pencil" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </>
            )}
          </View>
          <Text style={styles.profileRole}>Customer</Text>
        </View>

        <View style={styles.infoSection}>
          {renderEditableField("Mobile Number", "mobile", user.mobile)}
          {renderEditableField("Email Address", "email", user.email)}
          {renderEditableField("Address", "address", user.address)}
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
  infoSection: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  infoRow: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(37, 99, 235, 0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  infoContent: { flex: 1 },

  infoLabel: { fontSize: 12, color: Colors.textSecondary, marginBottom: 2 },
  infoValue: { fontSize: 16, color: Colors.text },
  editInput: {
    fontSize: 16,
    color: Colors.text,
    borderBottomWidth: 1,
    borderBottomColor: Colors.primary,
    paddingVertical: 2,
  },
  actions: { marginTop: "auto" },
});
