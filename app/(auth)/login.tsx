import { useStore } from "@/constants/Store";
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
import { Button } from "../../components/Button";
import { Colors } from "../../constants/Colors";

export default function LoginScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const role = (params.role as string) || "customer";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const loginWorker = useStore((state) => state.loginWorker);
  const loginCustomer = useStore((state) => state.loginCustomer);

  const handleLogin = async () => {
    // Validation
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    setLoading(true);
    try {
      // Login based on role
      if (role === "worker") {
        await loginWorker(email, password);
        router.replace("/(worker)" as any);
      } else {
        await loginCustomer(email, password);
        router.replace("/(customer)" as any);
      }
      Alert.alert("Success", "Logged in successfully!");
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Invalid credentials");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>
          Login as{" "}
          {role === "worker"
            ? "Service Professional"
            : role === "admin"
              ? "Admin"
              : "Customer"}
        </Text>

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
              editable={!loading}
              keyboardType="email-address"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
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

          {/* Demo Credentials Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoLabel}>Test Credentials:</Text>
            <Text style={styles.infoText}>
              {role === "worker"
                ? "Email: john@test.com"
                : "Email: customer@test.com"}
            </Text>
            <Text style={styles.infoText}>Password: password123</Text>
          </View>

          <Pressable
            style={({ pressed }) => [
              {
                backgroundColor: Colors.primary,
                paddingVertical: 14,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
                marginTop: 10,
              },
              pressed && { opacity: 0.7 },
              loading && { opacity: 0.6 },
            ]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.buttonContent}>
                <ActivityIndicator color="white" size="small" />
                <Text style={styles.buttonText}>Logging in...</Text>
              </View>
            ) : (
              <Text style={styles.buttonText}>Log In</Text>
            )}
          </Pressable>

          <Button
            title="Create Account"
            variant="ghost"
            onPress={() =>
              router.push({ pathname: "/(auth)/signup", params: { role } })
            }
            disabled={loading}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
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
  content: {
    padding: 24,
    flex: 1,
    justifyContent: "center",
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
  infoBox: {
    backgroundColor: "#F0F8FF",
    borderRadius: 8,
    padding: 12,
    marginVertical: 12,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#666",
    marginBottom: 6,
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#666",
  },
  backBtn: {
    marginBottom: 24,
  },
});
