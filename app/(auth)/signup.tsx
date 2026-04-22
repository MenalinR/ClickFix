import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/Button";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";

export default function SignupScreen() {
  const router = useRouter();
  const { role } = useLocalSearchParams();
  const userRole = (role as string) || "customer";

  // Common fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Worker-specific fields
  const [category, setCategory] = useState("Plumber");
  const [experience, setExperience] = useState("");

  // Store methods
  const registerWorker = useStore((state) => state.registerWorker);
  const registerCustomer = useStore((state) => state.registerCustomer);

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter your name");
      return false;
    }
    if (!email.trim()) {
      Alert.alert("Error", "Please enter your email");
      return false;
    }
    if (!email.includes("@")) {
      Alert.alert("Error", "Please enter a valid email");
      return false;
    }
    if (!phone.trim()) {
      Alert.alert("Error", "Please enter your phone number");
      return false;
    }
    if (!password.trim()) {
      Alert.alert("Error", "Please enter a password");
      return false;
    }
    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return false;
    }

    if (userRole === "worker") {
      if (!category.trim()) {
        Alert.alert("Error", "Please select a category");
        return false;
      }
      if (!experience.trim()) {
        Alert.alert("Error", "Please enter years of experience");
        return false;
      }
      if (isNaN(Number(experience))) {
        Alert.alert("Error", "Experience must be a number");
        return false;
      }
    }

    return true;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (userRole === "worker") {
        await registerWorker({
          name,
          email,
          phone,
          password,
          category,
          experience: Number(experience),
        });
        Alert.alert("Success", "Worker account created successfully!");
      } else {
        await registerCustomer({
          name,
          email,
          phone,
          password,
        });
        Alert.alert("Success", "Customer account created successfully!");
      }

      // Navigate to dashboard
      if (userRole === "worker") {
        router.replace("/(worker)");
      } else {
        router.replace("/(customer)/(tabs)/");
      }
    } catch (error: any) {
      Alert.alert("Signup Failed", error.message || "Failed to create account");
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "Plumber",
    "Electrician",
    "Carpenter",
    "Cleaner",
    "AC Technician",
    "Painter",
    "Other",
  ];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join as a{" "}
            {userRole === "worker" ? "Service Professional" : "Customer"}
          </Text>

          <View style={styles.form}>
            {/* Common Fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                value={name}
                onChangeText={setName}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                editable={!loading}
              />
            </View>

            {/* Worker-Specific Fields */}
            {userRole === "worker" && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.pickerContainer}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                    >
                      {categories.map((cat) => (
                        <Pressable
                          key={cat}
                          style={[
                            styles.categoryButton,
                            category === cat && styles.categoryButtonActive,
                          ]}
                          onPress={() => setCategory(cat)}
                          disabled={loading}
                        >
                          <Text
                            style={[
                              styles.categoryText,
                              category === cat && styles.categoryTextActive,
                            ]}
                          >
                            {cat}
                          </Text>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Years of Experience</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 5"
                    value={experience}
                    onChangeText={setExperience}
                    keyboardType="decimal-pad"
                    editable={!loading}
                  />
                </View>
              </>
            )}

            {/* Password Fields */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter password (min 6 characters)"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Confirm your password"
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                editable={!loading}
              />
            </View>

            {/* Sign Up Button */}
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
              onPress={handleSignup}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator color="white" size="small" />
                  <Text style={styles.buttonText}>Creating Account...</Text>
                </View>
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </Pressable>

            {/* Back to Login */}
            <Button
              title="Already have an account? Log In"
              variant="ghost"
              onPress={() => router.back()}
              disabled={loading}
            />
          </View>
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
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 24,
    justifyContent: "center",
    minHeight: "100%",
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
    marginBottom: 32,
  },
  form: {
    gap: 16,
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
  pickerContainer: {
    height: 50,
  },
  categoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    marginRight: 8,
    justifyContent: "center",
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  categoryTextActive: {
    color: Colors.white,
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
