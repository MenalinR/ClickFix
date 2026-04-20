import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";

export default function AdminSettings() {
  const router = useRouter();
  const { logout } = useStore();
  const [notifications, setNotifications] = React.useState(true);
  const [autoApprove, setAutoApprove] = React.useState(false);
  const [maintenance, setMaintenance] = React.useState(false);

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

  const settingsSections = [
    {
      title: "General",
      items: [
        {
          icon: "notifications-outline",
          label: "Push Notifications",
          type: "toggle",
          value: notifications,
          onToggle: setNotifications,
        },
        {
          icon: "checkmark-circle-outline",
          label: "Auto-approve Workers",
          type: "toggle",
          value: autoApprove,
          onToggle: setAutoApprove,
        },
        {
          icon: "construct-outline",
          label: "Maintenance Mode",
          type: "toggle",
          value: maintenance,
          onToggle: setMaintenance,
        },
      ],
    },
    {
      title: "App Management",
      items: [
        { icon: "pricetag-outline", label: "Service Categories", type: "link" },
        { icon: "cash-outline", label: "Payment Settings", type: "link" },
        {
          icon: "shield-checkmark-outline",
          label: "Security & Privacy",
          type: "link",
        },
        {
          icon: "document-text-outline",
          label: "Terms & Conditions",
          type: "link",
        },
      ],
    },
    {
      title: "System",
      items: [
        { icon: "analytics-outline", label: "Analytics", type: "link" },
        {
          icon: "cloud-upload-outline",
          label: "Backup & Restore",
          type: "link",
        },
        { icon: "code-outline", label: "API Management", type: "link" },
        { icon: "bug-outline", label: "Error Logs", type: "link" },
      ],
    },
    {
      title: "Account",
      items: [
        { icon: "person-outline", label: "Admin Profile", type: "link" },
        { icon: "people-outline", label: "Manage Admins", type: "link" },
        { icon: "lock-closed-outline", label: "Change Password", type: "link" },
      ],
    },
  ];

  const renderSettingItem = (item: any) => {
    if (item.type === "toggle") {
      return (
        <View key={item.label} style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <View style={styles.iconContainer}>
              <Ionicons
                name={item.icon as any}
                size={22}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.settingLabel}>{item.label}</Text>
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: Colors.border, true: Colors.primary + "40" }}
            thumbColor={item.value ? Colors.primary : Colors.card}
          />
        </View>
      );
    }

    return (
      <TouchableOpacity key={item.label} style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={item.icon as any}
              size={22}
              color={Colors.primary}
            />
          </View>
          <Text style={styles.settingLabel}>{item.label}</Text>
        </View>
        <Ionicons
          name="chevron-forward"
          size={20}
          color={Colors.textSecondary}
        />
      </TouchableOpacity>
    );
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

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: "#FF6B6B" }]}>
            Danger Zone
          </Text>
          <View style={styles.sectionContent}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: "#FF6B6B20" },
                  ]}
                >
                  <Ionicons name="refresh-outline" size={22} color="#FF6B6B" />
                </View>
                <Text style={styles.settingLabel}>Reset App Data</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: "#FF6B6B20" },
                  ]}
                >
                  <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
                </View>
                <Text style={styles.settingLabel}>Clear All Data</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={20}
                color={Colors.textSecondary}
              />
            </TouchableOpacity>
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
    </SafeAreaView>
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
    flex: 1,
  },
});
