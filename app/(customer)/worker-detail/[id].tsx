import DateTimePicker from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Button } from "../../../components/Button";
import { Colors } from "../../../constants/Colors";
import { useStore } from "../../../constants/Store";
import { api, apiCall, apiUpload } from "../../../constants/api";

export default function WorkerProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { workers, createJob, user, token } = useStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState("");
  const [media, setMedia] = useState([]);
  const [workerData, setWorkerData] = useState<any>(null);
  const [workerExperience, setWorkerExperience] = useState<number>(0);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [busySlots, setBusySlots] = useState<
    { start: string; durationMinutes: number; status: string }[]
  >([]);
  const [calendarCursor, setCalendarCursor] = useState<Date>(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [dateDetailFor, setDateDetailFor] = useState<Date | null>(null);

  // Find the worker by id from the store
  const worker = workerData || workers.find((w) => String(w.id) === String(id));

  useEffect(() => {
    const loadWorker = async () => {
      if (!id) return;
      try {
        const response = await apiCall(api.workers.getById(String(id)), "GET");
        if (response?.data) {
          const normalizedExperience = Number(
            response.data.experience ??
              response.data.exp ??
              response.data.yearsOfExperience ??
              0,
          );

          setWorkerData({
            ...response.data,
            id: response.data.id || response.data._id,
            about:
              response.data.bio ||
              response.data.about ||
              "No description available",
            reviews: response.data.reviews || [],
            experienceDocuments: response.data.experienceDocuments || [],
            educationDocuments: response.data.educationDocuments || [],
            certificates: response.data.certificates || [],
            image: response.data.image || "https://via.placeholder.com/150",
            experience: Number.isFinite(normalizedExperience)
              ? normalizedExperience
              : 0,
          });
          setWorkerExperience(
            Number.isFinite(normalizedExperience) ? normalizedExperience : 0,
          );
        }
      } catch (error) {
        console.error("Failed to load worker details:", error);
      }
    };

    loadWorker();
  }, [id]);

  const loadBusySlots = React.useCallback(async () => {
    try {
      const workerId =
        (workerData as any)?._id ||
        (workerData as any)?.id ||
        worker?._id ||
        worker?.id;
      if (!workerId) return;
      const response = await apiCall(
        api.jobs.workerBusy(String(workerId)),
        "GET",
        undefined,
        token || undefined,
      );
      setBusySlots(response?.data || []);
    } catch (e) {
      setBusySlots([]);
    }
  }, [workerData, worker, token]);

  useEffect(() => {
    if (modalVisible) loadBusySlots();
  }, [modalVisible, loadBusySlots]);

  if (!worker) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Worker not found.</Text>
      </View>
    );
  }

  const handleBook = async () => {
    if (!description.trim()) {
      Alert.alert("Description required", "Please describe your issue.");
      return;
    }
    if (!token || !user?._id) {
      Alert.alert("Error", "Please log in to book.");
      return;
    }
    if (scheduledAt.getTime() < Date.now()) {
      Alert.alert("Invalid time", "Please pick a date and time in the future.");
      return;
    }
    try {
      const workerId = worker._id || worker.id;

      // Upload any selected photos, collect their URLs
      const imageUrls: string[] = [];
      for (const uri of media as string[]) {
        try {
          const filename = uri.split("/").pop() || `photo-${Date.now()}.jpg`;
          const match = /\.(\w+)$/.exec(filename);
          const ext = (match?.[1] || "jpg").toLowerCase();
          const mime = ext === "png" ? "image/png" : "image/jpeg";
          const formData = new FormData();
          formData.append("document", {
            uri,
            name: filename,
            type: mime,
          } as any);
          const up = await apiUpload(
            api.jobs.uploadImage,
            formData,
            token || undefined,
          );
          if (up?.data?.url) imageUrls.push(up.data.url);
        } catch (upErr) {
          console.error("Image upload failed:", upErr);
        }
      }

      const job = await createJob({
        serviceType: worker.category || "Other",
        description: description.trim(),
        requestedWorkerId: workerId,
        scheduledDate: scheduledAt.toISOString(),
        images: imageUrls,
        location: {
          type: "Point",
          coordinates: [79.8612, 6.9271],
          address: "Address to be confirmed",
        },
      });
      setModalVisible(false);
      setDescription("");
      setMedia([]);
      setScheduledAt(new Date());
      Alert.alert("Booking confirmed", "The worker will be notified and can accept your request.", [
        { text: "OK", onPress: () => router.push("/(customer)/(tabs)/bookings") },
      ]);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to create booking.");
    }
  };

  const formatScheduledDate = (d: Date) =>
    d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  const formatScheduledTime = (d: Date) =>
    d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleDateChange = (_event: any, selected?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selected) {
      const next = new Date(scheduledAt);
      next.setFullYear(
        selected.getFullYear(),
        selected.getMonth(),
        selected.getDate(),
      );
      setScheduledAt(next);
    }
  };
  const slotsOnSelectedDate = busySlots.filter((s) => {
    const d = new Date(s.start);
    return (
      d.getFullYear() === scheduledAt.getFullYear() &&
      d.getMonth() === scheduledAt.getMonth() &&
      d.getDate() === scheduledAt.getDate()
    );
  });

  const SLOT_HOURS = [8, 10, 12, 14, 16, 18];
  const SLOT_DURATION_MIN = 120;
  const fmtSlot = (h: number) => {
    const end = h + 2;
    const fmt = (n: number) => {
      const hour = ((n + 11) % 12) + 1;
      const ap = n < 12 ? "AM" : "PM";
      return `${hour}${ap}`;
    };
    return `${fmt(h)} - ${fmt(end)}`;
  };
  const timeSlotsForSelectedDate = SLOT_HOURS.map((h) => {
    const slotStart = new Date(
      scheduledAt.getFullYear(),
      scheduledAt.getMonth(),
      scheduledAt.getDate(),
      h,
      0,
      0,
      0,
    ).getTime();
    const slotEnd = slotStart + SLOT_DURATION_MIN * 60000;
    let hasPending = false;
    let hasBusy = false;
    for (const s of slotsOnSelectedDate) {
      const bStart = new Date(s.start).getTime();
      const bEnd = bStart + (s.durationMinutes || 120) * 60000;
      const overlaps = bStart < slotEnd && bEnd > slotStart;
      if (!overlaps) continue;
      const st = (s.status || "").toLowerCase();
      if (st === "pending") hasPending = true;
      else hasBusy = true;
    }
    const isPast = slotEnd <= Date.now();
    const status: "available" | "pending" | "busy" =
      hasBusy || isPast ? "busy" : hasPending ? "pending" : "available";
    return { hour: h, label: fmtSlot(h), status };
  });

  const handleTimeChange = (_event: any, selected?: Date) => {
    setShowTimePicker(Platform.OS === "ios");
    if (selected) {
      const next = new Date(scheduledAt);
      next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
      setScheduledAt(next);
    }
  };

  const pickMedia = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Please allow access to your media library.",
      );
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
      const uris = result.assets
        ? result.assets.map((a) => a.uri)
        : [result.uri];
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
      <Stack.Screen
        options={{
          title: worker?.name || "Worker Details",
          headerShown: true,
        }}
      />
      <ScrollView>
        <Image source={{ uri: worker.image }} style={styles.coverImage} />
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.name}>{worker.name}</Text>
          <Text style={styles.category}>{worker.category}</Text>

          {/* Contact Information */}
          <View style={styles.contactSection}>
            <View style={styles.contactItem}>
              <Ionicons name="call-outline" size={18} color={Colors.primary} />
              <Text style={styles.contactText}>
                {worker.phone || "Not provided"}
              </Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons
                name="location-outline"
                size={18}
                color={Colors.primary}
              />
              <Text style={styles.contactText}>
                {worker.location?.address || worker.address || "Not provided"}
              </Text>
            </View>
          </View>

          <View style={styles.stats}>
            <View style={styles.statItem}>
              <Ionicons name="star" size={20} color={Colors.accent} />
              <Text style={styles.statValue}>{worker.rating}</Text>
              <Text style={styles.statLabel}>Rating</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color={Colors.primary} />
              <Text style={styles.statValue}>
                {Number(worker.experience ?? workerExperience ?? 0)} Yr
              </Text>
              <Text style={styles.statLabel}>Exp.</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons
                name="pricetag-outline"
                size={20}
                color={Colors.success}
              />
              <Text style={styles.statValue}>{worker.hourlyRate}</Text>
              <Text style={styles.statLabel}>LKR/hr</Text>
            </View>
          </View>

          <Text style={styles.sectionHeader}>About</Text>
          <Text style={styles.bio}>{worker.about}</Text>

          <Text style={styles.sectionHeader}>Experience</Text>
          {(worker.experienceDocuments || []).length > 0 ? (
            (worker.experienceDocuments || []).map((doc, index) => (
              <View key={doc._id || index} style={styles.documentCard}>
                <Text style={styles.documentTitle}>
                  {doc.name || "Experience Document"}
                </Text>
                {!!doc.description ? (
                  <Text style={styles.documentText}>{doc.description}</Text>
                ) : null}
                {(doc.issueDate || doc.expiryDate) ? (
                  <Text style={styles.documentMeta}>
                    {(doc.issueDate
                      ? new Date(doc.issueDate).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })
                      : "") +
                      (doc.issueDate ? " – " : "") +
                      (doc.expiryDate
                        ? new Date(doc.expiryDate).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })
                        : "Present")}
                  </Text>
                ) : null}
                <Text style={styles.documentMeta}>
                  {doc.documentType || "Document"}
                </Text>
                {!!doc.url ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setPreviewImage(doc.url)}
                  >
                    <Image
                      source={{ uri: doc.url }}
                      style={styles.certificateImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.viewHint}>Tap to view</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.bio}>No experience details available</Text>
          )}

          <Text style={styles.sectionHeader}>Education</Text>
          {(worker.educationDocuments || []).length > 0 ? (
            (worker.educationDocuments || []).map((doc, index) => (
              <View key={doc._id || index} style={styles.documentCard}>
                <Text style={styles.documentTitle}>
                  {doc.name || "Education Document"}
                </Text>
                {!!doc.institution ? (
                  <Text style={styles.institutionText}>{doc.institution}</Text>
                ) : null}
                {!!doc.description ? (
                  <Text style={styles.documentText}>{doc.description}</Text>
                ) : null}
                {(doc.startDate || doc.endDate) ? (
                  <Text style={styles.documentMeta}>
                    {(doc.startDate
                      ? new Date(doc.startDate).toLocaleDateString("en-US", {
                          month: "short",
                          year: "numeric",
                        })
                      : "") +
                      (doc.startDate ? " – " : "") +
                      (doc.endDate
                        ? new Date(doc.endDate).toLocaleDateString("en-US", {
                            month: "short",
                            year: "numeric",
                          })
                        : "Present")}
                  </Text>
                ) : null}
                <Text style={styles.documentMeta}>
                  {doc.documentType || "Document"}
                </Text>
                {!!doc.url ? (
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => setPreviewImage(doc.url)}
                  >
                    <Image
                      source={{ uri: doc.url }}
                      style={styles.certificateImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.viewHint}>Tap to view</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          ) : (
            <Text style={styles.bio}>No education details available</Text>
          )}

          {/* Skills Section */}
          {worker.skills && worker.skills.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>Skills</Text>
              <View style={styles.skillsContainer}>
                {worker.skills.map((skill, index) => (
                  <View key={index} style={styles.skillTag}>
                    <Text style={styles.skillText}>{skill}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          <Text style={styles.sectionHeader}>Reviews</Text>
          {(worker.reviews || []).map((r) => (
            <View key={r.id} style={styles.reviewCard}>
              <Text style={styles.reviewUser}>{r.user}</Text>
              <Text style={styles.reviewText}>{r.text}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Book Now"
          onPress={() => {
            setScheduledAt(new Date());
            setModalVisible(true);
          }}
        />
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
              onChangeText={(text) => {
                setDescription(text);
                console.log("Description input:", text);
              }}
              multiline
            />

            {/* When do you need the service */}
            <Text style={styles.sectionHeader}>When do you need it?</Text>
            <View style={styles.scheduleRow}>
              <TouchableOpacity
                style={styles.scheduleBtn}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.scheduleBtnText}>
                  {formatScheduledDate(scheduledAt)}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.scheduleBtn}
                onPress={() => setShowTimePicker(true)}
              >
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.scheduleBtnText}>
                  {formatScheduledTime(scheduledAt)}
                </Text>
              </TouchableOpacity>
            </View>
            {showDatePicker && (
              <DateTimePicker
                value={scheduledAt}
                mode="date"
                minimumDate={new Date()}
                onChange={handleDateChange}
              />
            )}
            {showTimePicker && (
              <DateTimePicker
                value={scheduledAt}
                mode="time"
                onChange={handleTimeChange}
              />
            )}

            {/* Worker's schedule calendar */}
            <Text style={styles.slotsHeader}>
              Worker's schedule — tap a day to see times
            </Text>
            <View style={styles.calLegend}>
              <View style={styles.calLegendItem}>
                <View
                  style={[
                    styles.calLegendSwatch,
                    { backgroundColor: "#FFF8E1" },
                  ]}
                />
                <Text style={styles.calLegendText}>Pending</Text>
              </View>
              <View style={styles.calLegendItem}>
                <View
                  style={[
                    styles.calLegendSwatch,
                    { backgroundColor: "#FFEBEE" },
                  ]}
                />
                <Text style={styles.calLegendText}>Busy</Text>
              </View>
            </View>
            <View style={styles.bookingCalendar}>
              <View style={styles.calMonthRow}>
                <TouchableOpacity
                  style={styles.calNavBtn}
                  onPress={() =>
                    setCalendarCursor(
                      new Date(
                        calendarCursor.getFullYear(),
                        calendarCursor.getMonth() - 1,
                        1,
                      ),
                    )
                  }
                >
                  <Ionicons
                    name="chevron-back"
                    size={18}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
                <Text style={styles.calMonthLabel}>
                  {calendarCursor.toLocaleString("en-GB", {
                    month: "long",
                    year: "numeric",
                  })}
                </Text>
                <TouchableOpacity
                  style={styles.calNavBtn}
                  onPress={() =>
                    setCalendarCursor(
                      new Date(
                        calendarCursor.getFullYear(),
                        calendarCursor.getMonth() + 1,
                        1,
                      ),
                    )
                  }
                >
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.calDaysRow}>
                {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                  <Text key={i} style={styles.calDayLabel}>
                    {d}
                  </Text>
                ))}
              </View>
              <View style={styles.calGrid}>
                {(() => {
                  const firstDow = new Date(
                    calendarCursor.getFullYear(),
                    calendarCursor.getMonth(),
                    1,
                  ).getDay();
                  const daysInMonth = new Date(
                    calendarCursor.getFullYear(),
                    calendarCursor.getMonth() + 1,
                    0,
                  ).getDate();
                  const cells: (Date | null)[] = [];
                  for (let i = 0; i < firstDow; i++) cells.push(null);
                  for (let d = 1; d <= daysInMonth; d++)
                    cells.push(
                      new Date(
                        calendarCursor.getFullYear(),
                        calendarCursor.getMonth(),
                        d,
                      ),
                    );
                  while (cells.length % 7 !== 0) cells.push(null);
                  return cells.map((cell, idx) => {
                    if (!cell)
                      return <View key={idx} style={styles.calCell} />;
                    const dayBusy = busySlots.filter((s) => {
                      const d = new Date(s.start);
                      return (
                        d.getFullYear() === cell.getFullYear() &&
                        d.getMonth() === cell.getMonth() &&
                        d.getDate() === cell.getDate()
                      );
                    });
                    const hasBusy = dayBusy.some(
                      (s) => (s.status || "").toLowerCase() !== "pending",
                    );
                    const hasPending = dayBusy.some(
                      (s) => (s.status || "").toLowerCase() === "pending",
                    );
                    return (
                      <TouchableOpacity
                        key={idx}
                        disabled={dayBusy.length === 0}
                        style={[
                          styles.calCell,
                          hasPending && !hasBusy && styles.calCellPending,
                          hasBusy && styles.calCellBusy,
                        ]}
                        onPress={() => setDateDetailFor(cell)}
                      >
                        <Text style={styles.calCellText}>
                          {cell.getDate()}
                        </Text>
                      </TouchableOpacity>
                    );
                  });
                })()}
              </View>
            </View>

            {/* Photos/Videos */}
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.sectionHeader}>Photos/Videos (Optional)</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8 }}
              >
                {media.map((uri, index) => (
                  <Image
                    key={index}
                    source={{ uri }}
                    style={styles.mediaThumbnail}
                  />
                ))}
                <TouchableOpacity
                  onPress={pickMedia}
                  style={styles.addMediaBtn}
                >
                  <Ionicons
                    name="camera-outline"
                    size={24}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.addMediaText}>Add</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                variant="ghost"
                onPress={resetForm}
                style={{ flex: 1 }}
              />
              <Button
                title="Confirm"
                onPress={handleBook}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!dateDetailFor}
        transparent
        animationType="fade"
        onRequestClose={() => setDateDetailFor(null)}
      >
        <View style={styles.dateDetailOverlay}>
          <View style={styles.dateDetailSheet}>
            <View style={styles.dateDetailHeader}>
              <Text style={styles.dateDetailTitle}>
                {dateDetailFor?.toLocaleDateString("en-GB", {
                  weekday: "long",
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </Text>
              <TouchableOpacity onPress={() => setDateDetailFor(null)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            {(dateDetailFor
              ? busySlots.filter((s) => {
                  const d = new Date(s.start);
                  return (
                    d.getFullYear() === dateDetailFor.getFullYear() &&
                    d.getMonth() === dateDetailFor.getMonth() &&
                    d.getDate() === dateDetailFor.getDate()
                  );
                })
              : []
            )
              .sort(
                (a, b) =>
                  new Date(a.start).getTime() - new Date(b.start).getTime(),
              )
              .map((s, i) => {
                const start = new Date(s.start);
                const isPending =
                  (s.status || "").toLowerCase() === "pending";
                return (
                  <View
                    key={i}
                    style={[
                      styles.dateDetailRow,
                      {
                        backgroundColor: isPending ? "#FFF8E1" : "#FFEBEE",
                        borderLeftColor: isPending ? "#FFA500" : "#C62828",
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        isPending ? "time-outline" : "lock-closed-outline"
                      }
                      size={16}
                      color={isPending ? "#F57F17" : "#C62828"}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.dateDetailTime}>
                        {start.toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      <Text style={styles.dateDetailStatus}>{s.status}</Text>
                    </View>
                  </View>
                );
              })}
          </View>
        </View>
      </Modal>

      <Modal visible={!!previewImage} animationType="fade" transparent>
        <View style={styles.imagePreviewOverlay}>
          <TouchableOpacity
            style={styles.imagePreviewCloseArea}
            onPress={() => setPreviewImage(null)}
            activeOpacity={1}
          >
            {previewImage ? (
              <Image
                source={{ uri: previewImage }}
                style={styles.imagePreview}
                resizeMode="contain"
              />
            ) : null}
            <Text style={styles.imagePreviewHint}>Tap anywhere to close</Text>
          </TouchableOpacity>
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
  contactSection: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    gap: 12,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  contactText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  skillsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  skillTag: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  skillText: {
    color: Colors.white,
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  documentCard: {
    backgroundColor: Colors.white,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  documentTitle: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
    marginBottom: 4,
  },
  institutionText: {
    fontSize: 13,
    fontWeight: "500",
    color: Colors.primary,
    marginBottom: 4,
  },
  documentText: {
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  documentMeta: {
    color: Colors.textSecondary,
    fontSize: 12,
  },
  certificateImage: {
    width: "100%",
    height: 180,
    borderRadius: 8,
    marginTop: 10,
    backgroundColor: "#f0f0f0",
  },
  viewHint: {
    marginTop: 6,
    fontSize: 12,
    color: Colors.textSecondary,
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreviewCloseArea: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  imagePreview: {
    width: "100%",
    height: "80%",
  },
  imagePreviewHint: {
    color: Colors.white,
    marginTop: 12,
    fontSize: 12,
  },
  scheduleRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  scheduleBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    backgroundColor: "#f9f9f9",
  },
  scheduleBtnText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
  },
  slotsHeader: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text,
    marginBottom: 8,
  },
  slotLegend: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  slotGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  slotPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  slotAvailable: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  slotPending: {
    backgroundColor: "#FFF8E1",
    borderColor: "#FFA500",
  },
  slotBusy: {
    backgroundColor: "#FFEBEE",
    borderColor: "#C62828",
  },
  slotSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  slotPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
  },
  slotBusyText: {
    color: "#C62828",
    textDecorationLine: "line-through",
  },
  slotSelectedText: {
    color: "white",
  },
  calLegend: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 8,
    flexWrap: "wrap",
  },
  calLegendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  calLegendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  calLegendText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  bookingCalendar: {
    backgroundColor: "#f9f9f9",
    borderRadius: 10,
    padding: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  calMonthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  calNavBtn: { padding: 4 },
  calMonthLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  calDaysRow: { flexDirection: "row", paddingBottom: 4 },
  calDayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  calGrid: { flexDirection: "row", flexWrap: "wrap" },
  calCell: {
    width: `${100 / 7}%`,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
  },
  calCellBusy: { backgroundColor: "#FFEBEE" },
  calCellPending: { backgroundColor: "#FFF8E1" },
  calCellText: { fontSize: 11, color: Colors.text },
  dateDetailOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  dateDetailSheet: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 18,
    width: "100%",
    maxWidth: 380,
  },
  dateDetailHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  dateDetailTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  dateDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderLeftWidth: 4,
    borderRadius: 8,
    marginBottom: 8,
  },
  dateDetailTime: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.text,
  },
  dateDetailStatus: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
    textTransform: "uppercase",
  },
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
