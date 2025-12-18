import React, { useState } from "react";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  TouchableOpacity,
  Platform,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import Ionicons from "react-native-vector-icons/Ionicons";
import { Colors } from "../../../constants/Colors";
import { Button } from "../../../components/Button";
import { useStore } from "../../../constants/Store";
import uuid from 'react-native-uuid';

export default function WorkerProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { workers, addJob } = useStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState([]);

  // Find the worker by id from the store
  const worker = workers.find((w) => String(w.id) === String(id));
  if (!worker) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Worker not found.</Text>
      </View>
    );
  }

  const handleBook = () => {
    console.log('Description on confirm:', description);
    if (!description.trim()) {
      Alert.alert("Description required", "Please describe your issue.");
      return;
    }
    // Add job to store
    addJob({
      id: uuid.v4(),
      customerId: 'c1', // Replace with real customer id if available
      workerId: worker.id,
      workerName: worker.name,
      service: worker.category,
      description,
      status: 'Pending',
      date: new Date().toISOString(),
      price: worker.hourlyRate,
      attachedMedia: media,
    });
    Alert.alert("Booking Confirmed", "Your booking has been confirmed.", [
      {
        text: "OK",
        onPress: () => {
          setModalVisible(false);
          setDescription("");
          setMedia([]);
          router.push("/(customer)/bookings");
        },
      },
    ]);
  };

  const pickMedia = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission required", "Please allow access to your media library.");
      return;
    }
    // Pick image or video
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsMultipleSelection: true,
      quality: 0.7,
    });
    if (!result.canceled) {
      // For multiple selection, result.assets is an array
      const uris = result.assets ? result.assets.map((a) => a.uri) : [result.uri];
      setMedia([...media, ...uris]);
    }
  };

  const resetForm = () => {
    setDescription("");
    setMedia([]);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView>
        <Image source={{ uri: worker.image }} style={styles.coverImage} />
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.name}>{worker.name}</Text>
          <Text style={styles.category}>{worker.category}</Text>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={20} color={Colors.accent} />
              <Text style={styles.statValue}>{worker.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <Text style={styles.statValue}>5 Yr</Text>
              <Text style={styles.statLabel}>Exp.</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="pricetag-outline" size={20} color={Colors.success} />
              <Text style={styles.statValue}>{worker.hourlyRate}</Text>
              <Text style={styles.statLabel}>LKR/hr</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>About</Text>
          <Text style={styles.bio}>{worker.about}</Text>

          <Text style={styles.sectionHeader}>Reviews</Text>
          {worker.reviews.map((r) => (
            <View key={r.id} style={styles.reviewCard}>
              <Text style={styles.reviewUser}>{r.user}</Text>
              <Text style={styles.reviewText}>{r.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button title="Book Now" onPress={() => setModalVisible(true)} />
      </View>

      {/* Booking Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Book Service</Text>
            <Text style={styles.modalSub}>
              Describe your issue for {worker.name}
            </Text>

            <TextInput
              style={styles.input}
              placeholder="e.g., Leaking pipe in kitchen..."
              value={description}
              onChangeText={text => {
                setDescription(text);
                console.log('Description input:', text);
              }}
              multiline
            />

            {/* Photos/Videos */}
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.sectionHeader}>Photos/Videos (Optional)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {media.map((uri, index) => (
                  <Image key={index} source={{ uri }} style={styles.mediaThumbnail} />
                ))}
                <TouchableOpacity onPress={pickMedia} style={styles.addMediaBtn}>
                  <Ionicons name="camera-outline" size={24} color={Colors.textSecondary} />
                  <Text style={styles.addMediaText}>Add</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <View style={styles.modalActions}>
              <Button title="Cancel" variant="ghost" onPress={resetForm} style={{ flex: 1 }} />
              <Button title="Confirm" onPress={handleBook} style={{ flex: 1 }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  coverImage: { width: "100%", height: 250 },
  content: {
    padding: 24,
    paddingBottom: 100,
    marginTop: -20,
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  name: { fontSize: 28, fontFamily: "Inter_700Bold", color: Colors.text },
  category: { fontSize: 16, color: Colors.textSecondary, marginBottom: 24 },
  stats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
  },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold", marginTop: 4 },
  statLabel: { fontSize: 12, color: Colors.textSecondary },
  sectionHeader: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
    marginTop: 12,
  },
  bio: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  reviewCard: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  reviewUser: { fontFamily: "Inter_600SemiBold", marginBottom: 4 },
  reviewText: { color: Colors.textSecondary },
  footer: {
    padding: 24,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: Colors.white,
    padding: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalTitle: { fontSize: 20, fontFamily: "Inter_700Bold", marginBottom: 8 },
  modalSub: { color: Colors.textSecondary, marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    height: 100,
    textAlignVertical: "top",
    marginBottom: 16,
  },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 8 },
  backBtn: {
    position: "absolute",
    top: 40,
    left: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  mediaThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  addMediaBtn: {
    width: 80,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  addMediaText: { fontSize: 12, color: Colors.textSecondary, marginTop: 4 },
  // New styles for Android picker buttons
  pickerButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: "#f9f9f9",
    justifyContent: "center",
    minHeight: 56,
  },
  pickerButtonText: {
    fontSize: 16,
    color: Colors.text,
    textAlign: "center",
  },
});