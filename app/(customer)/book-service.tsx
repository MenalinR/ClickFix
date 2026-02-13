import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";

export default function BookServicePage() {
  const router = useRouter();
  const { serviceType } = useLocalSearchParams();
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [urgency, setUrgency] = useState<"Normal" | "Urgent">("Normal");
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);

  const serviceDetails: {
    [key: string]: {
      emoji: string;
      name: string;
      description: string;
      startPrice: string;
    };
  } = {
    electrician: {
      emoji: "⚡",
      name: "Electrician",
      description: "Electrical repairs and installations",
      startPrice: "1,500",
    },
    plumber: {
      emoji: "🚿",
      name: "Plumber",
      description: "Plumbing fixes and maintenance",
      startPrice: "1,200",
    },
    ac: {
      emoji: "❄️",
      name: "AC Technician",
      description: "Air conditioner service and repair",
      startPrice: "2,000",
    },
    carpenter: {
      emoji: "🧰",
      name: "Carpenter",
      description: "Carpentry and woodwork",
      startPrice: "1,800",
    },
  };

  const service =
    serviceDetails[serviceType as string] || serviceDetails["electrician"];

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setUploadedImages([...uploadedImages, result.assets[0].uri]);
    }
  };

  const handleNext = () => {
    router.push({
      pathname: "/worker-selection",
      params: {
        serviceType,
        description,
        date: selectedDate,
        time: selectedTime,
        urgency,
        imagesCount: uploadedImages.length,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.heading}>Describe Problem</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Service Type Card */}
        <View style={styles.serviceCard}>
          <Text style={styles.serviceEmoji}>{service.emoji}</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.serviceDesc}>{service.description}</Text>
            <Text style={styles.startingPrice}>
              Starting from {service.startPrice} LKR
            </Text>
          </View>
        </View>

        {/* Problem Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>What's the problem? 🤔</Text>
          <TextInput
            style={styles.descriptionInput}
            placeholder="Describe the issue in detail. This helps workers understand your problem better..."
            placeholderTextColor={Colors.textSecondary}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={6}
          />
          <Text style={styles.characterCount}>{description.length}/500</Text>
        </View>

        {/* Photos & Videos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Photos / Videos (Optional)</Text>
          <TouchableOpacity style={styles.uploadButton} onPress={pickImage}>
            <Ionicons
              name="cloud-upload-outline"
              size={32}
              color={Colors.primary}
            />
            <Text style={styles.uploadText}>Tap to upload photos</Text>
            <Text style={styles.uploadSubtext}>
              Helps workers diagnose better
            </Text>
          </TouchableOpacity>

          {uploadedImages.length > 0 && (
            <View style={styles.imagesContainer}>
              {uploadedImages.map((image, idx) => (
                <View key={idx} style={styles.imageCard}>
                  <Image source={{ uri: image }} style={styles.thumbnail} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={() =>
                      setUploadedImages(
                        uploadedImages.filter((_, i) => i !== idx),
                      )
                    }
                  >
                    <Ionicons name="close-circle" size={20} color="#FF6B6B" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferred Date & Time</Text>
          <TouchableOpacity style={styles.dateTimeInput}>
            <Ionicons
              name="calendar-outline"
              size={20}
              color={Colors.primary}
            />
            <TextInput
              style={styles.dateTimeInputField}
              placeholder="Select date"
              placeholderTextColor={Colors.textSecondary}
              value={selectedDate}
              onChangeText={setSelectedDate}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.dateTimeInput}>
            <Ionicons name="time-outline" size={20} color={Colors.primary} />
            <TextInput
              style={styles.dateTimeInputField}
              placeholder="Select time"
              placeholderTextColor={Colors.textSecondary}
              value={selectedTime}
              onChangeText={setSelectedTime}
            />
          </TouchableOpacity>
        </View>

        {/* Urgency Level */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Urgency Level</Text>
          <View style={styles.urgencyContainer}>
            <TouchableOpacity
              style={[
                styles.urgencyButton,
                urgency === "Normal" && styles.urgencyButtonActive,
              ]}
              onPress={() => setUrgency("Normal")}
            >
              <Text
                style={[
                  styles.urgencyText,
                  urgency === "Normal" && styles.urgencyTextActive,
                ]}
              >
                ⏱️ Normal
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.urgencyButton,
                urgency === "Urgent" && styles.urgencyButtonActive,
              ]}
              onPress={() => setUrgency("Urgent")}
            >
              <Text
                style={[
                  styles.urgencyText,
                  urgency === "Urgent" && styles.urgencyTextActive,
                ]}
              >
                🚨 Urgent
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.infoText}>
            Providing details helps professionals give accurate quotes and
            faster service!
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.nextButton,
            !description.trim() && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!description.trim()}
        >
          <Text style={styles.nextButtonText}>Find Worker</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
  },
  serviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 12,
  },
  serviceEmoji: {
    fontSize: 40,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 4,
  },
  serviceDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  startingPrice: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.primary,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 12,
  },
  descriptionInput: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: Colors.text,
    textAlignVertical: "top",
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "right",
  },
  uploadButton: {
    backgroundColor: Colors.lightBackground,
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: "dashed",
  },
  uploadText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.primary,
    marginTop: 12,
  },
  uploadSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  imagesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 16,
  },
  imageCard: {
    position: "relative",
    width: "31%",
    aspectRatio: 1,
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: Colors.lightBackground,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  removeImageButton: {
    position: "absolute",
    top: 4,
    right: 4,
  },
  dateTimeInput: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateTimeInputField: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: Colors.text,
  },
  urgencyContainer: {
    flexDirection: "row",
    gap: 10,
  },
  urgencyButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: Colors.lightBackground,
    borderWidth: 2,
    borderColor: "transparent",
  },
  urgencyButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  urgencyText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  urgencyTextActive: {
    color: "white",
  },
  infoCard: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#90CAF9",
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#1565C0",
    lineHeight: 16,
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nextButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  nextButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  nextButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
