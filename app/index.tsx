import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../components/Button";
import { Colors } from "../constants/Colors";

const { width, height } = Dimensions.get("window");

import { useRouter } from "expo-router";

export default function LandingPage() {
  const router = useRouter();

  const handleCustomerPress = () => {
    router.push({ pathname: "/(auth)/login", params: { role: "customer" } });
  };

  const handleWorkerPress = () => {
    router.push({ pathname: "/(auth)/login", params: { role: "worker" } });
  };

  const handleAdminPress = () => {
    router.push("/(auth)/admin-login");
  };

  const handleHardwareShopPress = () => {
    router.push("/(auth)/admin-login");
  };

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar style="light" />

      {/* Decorative Background Elements */}
      {/* <View style={styles.circle1} />
            <View style={styles.circle2} /> */}

      <SafeAreaView style={styles.content}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>
              Click<Text style={styles.logoAccent}>Fix</Text>
            </Text>
          </View>
          <Text style={styles.tagline}>
            Your One-Stop{"\n"}Home Service Solution
          </Text>
          <Text style={styles.subtext}>
            Connect with verified professionals for all your home repair and
            maintenance needs in Sri Lanka.
          </Text>
        </View>

        <View style={styles.actions}>
          <Text style={styles.roleLabel}>Choose your role to get started</Text>

          <Button
            title="I need a Service"
            onPress={handleCustomerPress}
            style={styles.customerBtn}
          />

          <Button
            title="I am a Professional"
            onPress={handleWorkerPress}
            variant="outline"
            style={styles.workerBtn}
            textStyle={styles.workerBtnText}
          />

          <Button
            title="I am an Admin"
            onPress={handleAdminPress}
            variant="outline"
            style={{ borderColor: "#B0C4DE", borderWidth: 1.5 }}
            textStyle={{ color: "#DEE2E6" }}
          />

          <Button
            title="Hardware Shop"
            onPress={handleHardwareShopPress}
            variant="outline"
            style={styles.hardwareBtn}
            textStyle={styles.hardwareBtnText}
          />

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <TouchableOpacity onPress={handleCustomerPress}>
              <Text style={styles.loginLink}>Log In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  circle1: {
    position: "absolute",
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: Colors.secondary,
    opacity: 0.2,
  },
  circle2: {
    position: "absolute",
    bottom: -50,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: Colors.secondary,
    opacity: 0.1,
  },
  header: {
    marginTop: height * 0.1,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoText: {
    fontSize: 42,
    fontWeight: "bold",
    color: Colors.white,
    letterSpacing: -1,
  },
  logoAccent: {
    color: Colors.accent,
  },
  tagline: {
    fontSize: 32,
    fontWeight: "600",
    color: Colors.white,
    lineHeight: 40,
    marginBottom: 16,
  },
  subtext: {
    fontSize: 16,
    color: "#E0E0E0",
    lineHeight: 24,
  },
  actions: {
    gap: 16,
  },
  hardwareBtn: {
    borderColor: Colors.accent,
    borderWidth: 1.5,
  },
  hardwareBtnText: {
    color: Colors.accent,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B0C4DE",
    textAlign: "center",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  customerBtn: {
    backgroundColor: Colors.accent,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  workerBtn: {
    borderColor: "#B0C4DE",
    borderWidth: 1.5,
  },
  workerBtnText: {
    color: "#DEE2E6",
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  loginText: {
    color: "#E0E0E0",
  },
  loginLink: {
    color: Colors.accent,
    fontWeight: "600",
  },
});
