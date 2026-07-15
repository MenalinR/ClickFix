import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, apiCall } from "../../constants/api";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";

const ASPECTS = [
  { key: "professionalism", label: "Professionalism", icon: "briefcase-outline" },
  { key: "quality",         label: "Work Quality",    icon: "checkmark-done-outline" },
  { key: "punctuality",     label: "Punctuality",     icon: "time-outline" },
] as const;

const RATING_LABELS = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

export default function RatingReviewPage() {
  const router = useRouter();
  const { token } = useStore();
  const params = useLocalSearchParams();

  const jobId      = params.jobId      as string | undefined;
  const workerId   = params.workerId   as string | undefined;
  const workerName = (params.workerName  as string) || "Professional";
  const workerImage= params.workerImage as string | undefined;
  const serviceType= (params.serviceType as string) || "";

  const [rating, setRating]           = useState(0);
  const [aspectRatings, setAspectRatings] = useState({ professionalism: 0, quality: 0, punctuality: 0 });
  const [comment, setComment]         = useState("");
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [submitting, setSubmitting]   = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const setAspect = (key: keyof typeof aspectRatings, value: number) =>
    setAspectRatings((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async () => {
    if (rating === 0) {
      Alert.alert("Rating required", "Please select an overall star rating.");
      return;
    }
    if (!jobId || !workerId || !token) {
      Alert.alert("Error", "Missing job information. Please try again.");
      return;
    }
    try {
      setSubmitting(true);
      const filteredAspects = Object.fromEntries(
        Object.entries(aspectRatings).filter(([, v]) => v > 0),
      );
      const res = await apiCall(
        api.reviews.create,
        "POST",
        {
          jobId,
          workerId,
          rating,
          aspectRatings: filteredAspects,
          comment: comment.trim() || undefined,
          wouldRecommend: wouldRecommend ?? undefined,
        },
        token,
      );
      if (!res?.success) {
        Alert.alert("Error", res?.message || "Could not submit review.");
        return;
      }
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.replace("/(customer)/(tabs)/bookings");
      }, 2000);
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not submit review.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.heading}>Rate & Review</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Worker Card */}
        <View style={styles.workerCard}>
          {workerImage ? (
            <Image source={{ uri: workerImage }} style={styles.workerImage} />
          ) : (
            <View style={[styles.workerImage, styles.avatarFallback]}>
              <Ionicons name="person" size={28} color={Colors.primary} />
            </View>
          )}
          <View>
            <Text style={styles.workerName}>{workerName}</Text>
            {!!serviceType && <Text style={styles.serviceType}>{serviceType}</Text>}
          </View>
        </View>

        {/* Overall Rating */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>How was your experience?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity key={star} onPress={() => setRating(star)} style={styles.starBtn}>
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={44}
                  color={star <= rating ? "#FFA000" : Colors.border}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>{RATING_LABELS[rating - 1]} ({rating}/5)</Text>
          )}
        </View>

        {/* Aspect Ratings */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rate Specific Aspects</Text>
          {ASPECTS.map(({ key, label, icon }) => (
            <View key={key} style={styles.aspectRow}>
              <View style={styles.aspectLeft}>
                <Ionicons name={icon as any} size={18} color={Colors.primary} />
                <Text style={styles.aspectLabel}>{label}</Text>
              </View>
              <View style={styles.aspectStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setAspect(key, star)}>
                    <Ionicons
                      name={star <= aspectRatings[key] ? "star" : "star-outline"}
                      size={20}
                      color={star <= aspectRatings[key] ? "#FFA000" : Colors.border}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* Written Review */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Write a Review</Text>
          <Text style={styles.subtitle}>Share your experience with other users</Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Tell us about your experience..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={4}
            value={comment}
            onChangeText={setComment}
            maxLength={500}
          />
          <Text style={styles.charCount}>{comment.length}/500</Text>
        </View>

        {/* Recommend */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Would you recommend this professional?</Text>
          <View style={styles.recommendRow}>
            <TouchableOpacity
              style={[styles.recommendBtn, wouldRecommend === true && styles.recommendBtnActive]}
              onPress={() => setWouldRecommend(true)}
            >
              <Ionicons
                name="thumbs-up"
                size={20}
                color={wouldRecommend === true ? "white" : Colors.primary}
              />
              <Text style={[styles.recommendText, wouldRecommend === true && { color: "white" }]}>
                Yes
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.recommendBtn, wouldRecommend === false && styles.recommendBtnNo]}
              onPress={() => setWouldRecommend(false)}
            >
              <Ionicons
                name="thumbs-down"
                size={20}
                color={wouldRecommend === false ? "white" : Colors.textSecondary}
              />
              <Text style={[styles.recommendText, wouldRecommend === false && { color: "white" }]}>
                No
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Submit */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitBtn, (rating === 0 || submitting) && { opacity: 0.6 }]}
          onPress={handleSubmit}
          disabled={rating === 0 || submitting}
        >
          {submitting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitText}>Submit Review</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.successOverlay}>
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={64} color="#4CAF50" />
            <Text style={styles.successTitle}>Thank You!</Text>
            <Text style={styles.successMsg}>Your review has been submitted.</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16, paddingVertical: 12, paddingBottom: 90 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  backButton: { padding: 8 },
  heading: { fontSize: 22, fontWeight: "700", color: Colors.text },
  workerCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  workerImage: { width: 56, height: 56, borderRadius: 28 },
  avatarFallback: { backgroundColor: Colors.lightBackground, alignItems: "center", justifyContent: "center" },
  workerName: { fontSize: 16, fontWeight: "700", color: Colors.text },
  serviceType: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  card: {
    backgroundColor: "white", borderRadius: 12, padding: 16, marginBottom: 14,
    borderWidth: 1, borderColor: Colors.border,
  },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: Colors.text, marginBottom: 12 },
  subtitle: { fontSize: 12, color: Colors.textSecondary, marginBottom: 10 },
  starsRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 8 },
  starBtn: { padding: 4 },
  ratingLabel: { textAlign: "center", fontSize: 13, fontWeight: "600", color: "#FFA000" },
  aspectRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  aspectLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  aspectLabel: { fontSize: 13, color: Colors.text },
  aspectStars: { flexDirection: "row", gap: 4 },
  reviewInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13,
    color: Colors.text, textAlignVertical: "top", minHeight: 90, marginBottom: 6,
  },
  charCount: { fontSize: 11, color: Colors.textSecondary, textAlign: "right" },
  recommendRow: { flexDirection: "row", gap: 12 },
  recommendBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 12, borderRadius: 8, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.lightBackground,
  },
  recommendBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  recommendBtnNo: { backgroundColor: "#C62828", borderColor: "#C62828" },
  recommendText: { fontSize: 14, fontWeight: "600", color: Colors.text },
  footer: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "white", paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  submitBtn: {
    backgroundColor: Colors.primary, paddingVertical: 14,
    borderRadius: 10, alignItems: "center",
  },
  submitText: { color: "white", fontSize: 16, fontWeight: "700" },
  successOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  successBox: {
    backgroundColor: "white", borderRadius: 20, padding: 32,
    alignItems: "center", width: "75%",
  },
  successTitle: { fontSize: 20, fontWeight: "700", color: Colors.text, marginTop: 12 },
  successMsg: { fontSize: 13, color: Colors.textSecondary, marginTop: 6, textAlign: "center" },
});
