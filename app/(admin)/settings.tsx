import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { api, apiCall } from "../../constants/api";
import { useStore } from "../../constants/Store";

type NotificationPrefs = {
  newDocuments: boolean;
  newBookings: boolean;
  newShops: boolean;
};

const DEFAULT_PREFS: NotificationPrefs = {
  newDocuments: true,
  newBookings: true,
  newShops: true,
};

export default function AdminSettings() {
  const router = useRouter();
  const { logout, user, setUser, token } = useStore();
  const adminUser: any = user || {};

  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: adminUser.name || "",
    email: adminUser.email || "",
    phone: adminUser.phone || "",
  });
  const [profileSaving, setProfileSaving] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [prefs, setPrefs] = useState<NotificationPrefs>({
    ...DEFAULT_PREFS,
    ...(adminUser.notificationPreferences || {}),
  });
  const [prefsSaving, setPrefsSaving] = useState(false);

  useEffect(() => {
    if (profileOpen) {
      setProfileForm({
        name: adminUser.name || "",
        email: adminUser.email || "",
        phone: adminUser.phone || "",
      });
    }
  }, [profileOpen]);

  useEffect(() => {
    if (prefsOpen) {
      setPrefs({
        ...DEFAULT_PREFS,
        ...(adminUser.notificationPreferences || {}),
      });
    }
  }, [prefsOpen]);

  const handleLogout = () => {
    Alert.alert("Log out", "Are you sure you want to log out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/(auth)/admin-login" as any);
        },
      },
    ]);
  };

  const handleSaveProfile = async () => {
    if (!profileForm.name.trim() || !profileForm.email.trim()) {
      Alert.alert("Error", "Name and email are required.");
      return;
    }
    setProfileSaving(true);
    try {
      const res = await apiCall(
        api.auth.adminUpdateProfile,
        "PUT",
        profileForm,
        token,
      );
      if (res?.success && res.data) {
        const next = { ...adminUser, ...res.data, userType: "admin" };
        if (res.data._id) next.id = res.data._id;
        setUser(next);
        setProfileOpen(false);
        Alert.alert("Saved", "Profile updated successfully.");
      } else {
        Alert.alert("Error", res?.message || "Failed to update profile.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to update profile.");
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const { currentPassword, newPassword, confirmPassword } = passwordForm;
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "All password fields are required.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New password and confirmation do not match.");
      return;
    }
    setPasswordSaving(true);
    try {
      const res = await apiCall(
        api.auth.adminChangePassword,
        "PUT",
        { currentPassword, newPassword },
        token,
      );
      if (res?.success) {
        setPasswordOpen(false);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        Alert.alert("Saved", "Password changed successfully.");
      } else {
        Alert.alert("Error", res?.message || "Failed to change password.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to change password.");
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSavePrefs = async () => {
    setPrefsSaving(true);
    try {
      const res = await apiCall(
        api.auth.adminNotificationPreferences,
        "PUT",
        prefs,
        token,
      );
      if (res?.success) {
        const next = {
          ...adminUser,
          notificationPreferences: res.data || prefs,
        };
        setUser(next);
        setPrefsOpen(false);
        Alert.alert("Saved", "Notification preferences updated.");
      } else {
        Alert.alert("Error", res?.message || "Failed to update preferences.");
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message || "Failed to update preferences.");
    } finally {
      setPrefsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Settings</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* App Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.appIconContainer}>
            <Ionicons name="hammer" size={32} color={Colors.background} />
          </View>
          <Text style={styles.appName}>ClickFix Admin</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionContent}>
            <SettingLink
              icon="person-outline"
              label="Edit Profile"
              hint={adminUser.name || "—"}
              onPress={() => setProfileOpen(true)}
            />
            <SettingLink
              icon="lock-closed-outline"
              label="Change Password"
              onPress={() => setPasswordOpen(true)}
            />
            <SettingLink
              icon="notifications-outline"
              label="Notification Preferences"
              onPress={() => setPrefsOpen(true)}
            />
          </View>
        </View>

        {/* Session */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: "#FF6B6B" }]}>
            Session
          </Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
              <View style={styles.settingInfo}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: "#FF6B6B20" },
                  ]}
                >
                  <Ionicons name="log-out-outline" size={22} color="#FF6B6B" />
                </View>
                <Text
                  style={[
                    styles.settingLabel,
                    { color: "#FF6B6B", fontWeight: "600" },
                  ]}
                >
                  Log out
                </Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={profileOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setProfileOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setProfileOpen(false)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={profileForm.name}
              onChangeText={(text) =>
                setProfileForm({ ...profileForm, name: text })
              }
              placeholder="Full name"
              placeholderTextColor={Colors.textSecondary}
            />

            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.input}
              value={profileForm.email}
              onChangeText={(text) =>
                setProfileForm({ ...profileForm, email: text })
              }
              placeholder="Email"
              placeholderTextColor={Colors.textSecondary}
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.fieldLabel}>Phone</Text>
            <TextInput
              style={styles.input}
              value={profileForm.phone}
              onChangeText={(text) =>
                setProfileForm({ ...profileForm, phone: text })
              }
              placeholder="Phone"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="phone-pad"
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setProfileOpen(false)}
                disabled={profileSaving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSaveProfile}
                disabled={profileSaving}
              >
                <Text style={styles.saveBtnText}>
                  {profileSaving ? "Saving…" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={passwordOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setPasswordOpen(false)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Current Password</Text>
            <TextInput
              style={styles.input}
              value={passwordForm.currentPassword}
              onChangeText={(text) =>
                setPasswordForm({ ...passwordForm, currentPassword: text })
              }
              placeholder="Current password"
              placeholderTextColor={Colors.textSecondary}
              secureTextEntry
            />

            <Text style={styles.fieldLabel}>New Password</Text>
            <TextInput
              style={styles.input}
              value={passwordForm.newPassword}
              onChangeText={(text) =>
                setPasswordForm({ ...passwordForm, newPassword: text })
              }
              placeholder="At least 6 characters"
              placeholderTextColor={Colors.textSecondary}
              secureTextEntry
            />

            <Text style={styles.fieldLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.input}
              value={passwordForm.confirmPassword}
              onChangeText={(text) =>
                setPasswordForm({ ...passwordForm, confirmPassword: text })
              }
              placeholder="Repeat new password"
              placeholderTextColor={Colors.textSecondary}
              secureTextEntry
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setPasswordOpen(false)}
                disabled={passwordSaving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleChangePassword}
                disabled={passwordSaving}
              >
                <Text style={styles.saveBtnText}>
                  {passwordSaving ? "Saving…" : "Update"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notification Preferences Modal */}
      <Modal
        visible={prefsOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setPrefsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Preferences</Text>
              <TouchableOpacity onPress={() => setPrefsOpen(false)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <PrefRow
              label="New document uploads"
              hint="Workers submit IDs, experience or education"
              value={prefs.newDocuments}
              onChange={(v) => setPrefs({ ...prefs, newDocuments: v })}
            />
            <PrefRow
              label="New bookings"
              hint="Customers create new service bookings"
              value={prefs.newBookings}
              onChange={(v) => setPrefs({ ...prefs, newBookings: v })}
            />
            <PrefRow
              label="New hardware shops"
              hint="A hardware shop signs up"
              value={prefs.newShops}
              onChange={(v) => setPrefs({ ...prefs, newShops: v })}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalBtn, styles.cancelBtn]}
                onPress={() => setPrefsOpen(false)}
                disabled={prefsSaving}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalBtn, styles.saveBtn]}
                onPress={handleSavePrefs}
                disabled={prefsSaving}
              >
                <Text style={styles.saveBtnText}>
                  {prefsSaving ? "Saving…" : "Save"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function SettingLink({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: any;
  label: string;
  hint?: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingInfo}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={22} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingLabel}>{label}</Text>
          {!!hint && <Text style={styles.settingHint}>{hint}</Text>}
        </View>
      </View>
      <Ionicons
        name="chevron-forward"
        size={20}
        color={Colors.textSecondary}
      />
    </TouchableOpacity>
  );
}

function PrefRow({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <View style={styles.prefRow}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.prefLabel}>{label}</Text>
        <Text style={styles.prefHint}>{hint}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: Colors.border, true: Colors.primary + "40" }}
        thumbColor={value ? Colors.primary : Colors.card}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 10,
  },
  heading: {
    fontSize: 28,
    fontWeight: "bold",
    color: Colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  appIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  appName: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionContent: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.text,
  },
  settingHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    padding: 20,
    width: "100%",
    maxWidth: 420,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  fieldLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  modalBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  cancelBtn: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelBtnText: {
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  saveBtn: {
    backgroundColor: Colors.primary,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  prefLabel: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: "500",
  },
  prefHint: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
});
