import { api, apiCall } from "@/constants/api";
import { Colors } from "@/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Role = "worker" | "customer" | "admin" | "hardwareShop";

const roleLabel: Record<Role, string> = {
  worker: "Service Professional",
  customer: "Customer",
  admin: "Admin",
  hardwareShop: "Hardware Shop",
};

const loginRoute: Record<Role, { pathname: string; params?: Record<string, string> }> = {
  worker: { pathname: "/(auth)/login", params: { role: "worker" } },
  customer: { pathname: "/(auth)/login", params: { role: "customer" } },
  admin: { pathname: "/(auth)/admin-login" },
  hardwareShop: { pathname: "/(auth)/hardware-shop" },
};

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const role = ((params.role as string) || "customer") as Role;

  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    setLoading(true);
    try {
      const res = await apiCall(api.auth.forgotPassword, "POST", {
        email: email.trim(),
        userType: role,
      });
      if (res.success) {
        setStep("reset");
      } else {
        Alert.alert("Error", res.message || "Something went wrong");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!otp.trim()) {
      Alert.alert("Error", "Please enter the code we sent you");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await apiCall(api.auth.resetPassword, "POST", {
        email: email.trim(),
        userType: role,
        otp: otp.trim(),
        newPassword,
      });
      if (res.success) {
        Alert.alert("Success", "Your password has been reset. Please log in.", [
          { text: "OK", onPress: () => router.replace(loginRoute[role] as any) },
        ]);
      } else {
        Alert.alert("Error", res.message || "Something went wrong");
      }
    } catch (error: any) {
      Alert.alert("Error", error.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity
          onPress={() =>
            step === "reset" ? setStep("email") : router.back()
          }
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>

        <Text style={styles.title}>Forgot Password</Text>
        <Text style={styles.subtitle}>
          {step === "email"
            ? `Enter the email for your ${roleLabel[role]} account and we'll send you a reset code.`
            : `Enter the 6-digit code sent to ${email.trim()} and choose a new password.`}
        </Text>

        {step === "email" ? (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && { opacity: 0.7 },
                loading && { opacity: 0.6 },
              ]}
              onPress={handleSendCode}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.buttonText}>Sending...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Send Reset Code</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reset Code</Text>
              <TextInput
                style={styles.input}
                placeholder="6-digit code"
                placeholderTextColor="#999"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Enter new password"
                  placeholderTextColor="#999"
                  secureTextEntry={!showPassword}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  editable={!loading}
                />
                <Pressable
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={loading}
                >
                  <Ionicons
                    name={showPassword ? "eye" : "eye-off"}
                    size={20}
                    color={Colors.text}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm New Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Re-enter new password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
              />
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && { opacity: 0.7 },
                loading && { opacity: 0.6 },
              ]}
              onPress={handleResetPassword}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.buttonText}>Resetting...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </Pressable>

            <TouchableOpacity onPress={handleSendCode} disabled={loading}>
              <Text style={styles.resendText}>Didn't get a code? Resend</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 24,
    flex: 1,
    justifyContent: "center",
  },
  backBtn: {
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginBottom: 40,
    lineHeight: 22,
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    backgroundColor: Colors.white,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: Colors.text,
  },
  eyeIcon: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  resendText: {
    textAlign: "center",
    color: Colors.primary,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
});
