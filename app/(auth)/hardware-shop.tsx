import { api, apiCall } from "@/constants/api";
import { Colors } from "@/constants/Colors";
import { useStore } from "@/constants/Store";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HardwareShopLoginScreen() {
  const router = useRouter();
  const { registerHardwareShop, loginHardwareShop } = useStore();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Registration state
  const [shopName, setShopName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");

  const handleLogin = async () => {
    if (!loginEmail.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    if (!loginPassword.trim()) {
      Alert.alert("Error", "Please enter your password");
      return;
    }

    setLoading(true);
    try {
      await loginHardwareShop(loginEmail.trim(), loginPassword.trim());
      Alert.alert("Success", "Logged in to Hardware Shop!");
      router.replace("/(hardwareShop)/(tabs)/" as any);
    } catch (error: any) {
      Alert.alert("Login Failed", error.message || "Invalid credentials");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!shopName.trim()) {
      Alert.alert("Error", "Please enter shop name");
      return;
    }
    if (!regEmail.trim()) {
      Alert.alert("Error", "Please enter your email");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Error", "Please enter phone number");
      return;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Please enter password");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }
    if (!address.trim()) {
      Alert.alert("Error", "Please enter address");
      return;
    }
    if (!city.trim()) {
      Alert.alert("Error", "Please enter city");
      return;
    }
    if (!licenseNumber.trim()) {
      Alert.alert("Error", "Please enter license number");
      return;
    }

    setLoading(true);
    try {
      await registerHardwareShop({
        shopName: shopName.trim(),
        email: regEmail.trim(),
        phone: phone.trim(),
        password: password.trim(),
        address: address.trim(),
        city: city.trim(),
        licenseNumber: licenseNumber.trim(),
      });
      Alert.alert("Success", "Hardware shop registered successfully!");
      router.replace("/(hardwareShop)/(tabs)/" as any);
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message || "Failed to register");
      console.error("Registration error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace("/")} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <View style={styles.content}>
          <Text style={styles.title}>Hardware Shop</Text>

          {/* Tab Toggle */}
          <View style={styles.tabToggle}>
            <Pressable
              style={[styles.tab, isLogin && styles.tabActive]}
              onPress={() => setIsLogin(true)}
            >
              <Text
                style={[
                  styles.tabText,
                  isLogin && styles.tabTextActive,
                ]}
              >
                Login
              </Text>
            </Pressable>
            <Pressable
              style={[styles.tab, !isLogin && styles.tabActive]}
              onPress={() => setIsLogin(false)}
            >
              <Text
                style={[
                  styles.tabText,
                  !isLogin && styles.tabTextActive,
                ]}
              >
                Create Account
              </Text>
            </Pressable>
          </View>

          {/* Login Form */}
          {isLogin ? (
            <View style={styles.form}>
              <Text style={styles.subtitle}>Login as Hardware Shop</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={loginEmail}
                  onChangeText={setLoginEmail}
                  editable={!loading}
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
                    value={loginPassword}
                    onChangeText={setLoginPassword}
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

              <Pressable
                style={({ pressed }) => [
                  styles.loginButton,
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
            </View>
          ) : (
            // Registration Form
            <View style={styles.form}>
              <Text style={styles.subtitle}>Create Hardware Shop Account</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Shop Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter shop name"
                  placeholderTextColor="#999"
                  value={shopName}
                  onChangeText={setShopName}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={regEmail}
                  onChangeText={setRegEmail}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter phone number"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                  value={phone}
                  onChangeText={setPhone}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter street address"
                  placeholderTextColor="#999"
                  value={address}
                  onChangeText={setAddress}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>City</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter city"
                  placeholderTextColor="#999"
                  value={city}
                  onChangeText={setCity}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>License Number</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter license number"
                  placeholderTextColor="#999"
                  value={licenseNumber}
                  onChangeText={setLicenseNumber}
                  editable={!loading}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Enter password"
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

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showConfirmPassword}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    editable={!loading}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeIcon}
                    disabled={loading}
                  >
                    <Ionicons
                      name={showConfirmPassword ? "eye" : "eye-off"}
                      size={20}
                      color={Colors.text}
                    />
                  </Pressable>
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.loginButton,
                  pressed && { opacity: 0.7 },
                  loading && { opacity: 0.6 },
                ]}
                onPress={handleRegister}
                disabled={loading}
              >
                {loading ? (
                  <View style={styles.buttonContent}>
                    <ActivityIndicator color="white" size="small" />
                    <Text style={styles.buttonText}>Creating Account...</Text>
                  </View>
                ) : (
                  <Text style={styles.buttonText}>Create Account</Text>
                )}
              </Pressable>
            </View>
          )}
        </View>
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
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  backBtn: {
    marginBottom: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingBottom: 32,
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginBottom: 24,
  },
  tabToggle: {
    flexDirection: "row",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  tabActive: {
    backgroundColor: "white",
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#999",
  },
  tabTextActive: {
    color: Colors.primary,
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
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.text,
  },
  eyeIcon: {
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  loginButton: {
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
});
