import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
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
import { Colors } from "../../constants/Colors";

export default function RatingReviewPage() {
  const router = useRouter();
  const { workerName, workerImage } = useLocalSearchParams();
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);
  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const ratingLabels = ["Poor", "Fair", "Good", "Very Good", "Excellent"];

  const handleSubmitReview = () => {
    if (rating === 0) {
      alert("Please select a rating");
      return;
    }
    setShowSuccessModal(true);
    setTimeout(() => {
      setShowSuccessModal(false);
      router.push("./(tabs)");
    }, 2000);
  };

  const handleAddPhoto = (type: "before" | "after") => {
    if (type === "before") {
      setBeforePhoto("https://via.placeholder.com/300?text=Before");
    } else {
      setAfterPhoto("https://via.placeholder.com/300?text=After");
    }
  };

  const handleRemovePhoto = (type: "before" | "after") => {
    if (type === "before") {
      setBeforePhoto(null);
    } else {
      setAfterPhoto(null);
    }
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
          <Text style={styles.heading}>Rate & Review</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Worker Card */}
        <View style={styles.workerCard}>
          <Image
            source={{
              uri:
                typeof workerImage === "string"
                  ? workerImage
                  : "https://via.placeholder.com/60",
            }}
            style={styles.workerImage}
          />
          <View>
            <Text style={styles.workerName}>
              {workerName || "Professional"}
            </Text>
            <Text style={styles.jobTitle}>Plumber</Text>
          </View>
        </View>

        {/* Overall Rating */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>How was your experience?</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Ionicons
                  name={star <= rating ? "star" : "star-outline"}
                  size={48}
                  color={star <= rating ? Colors.primary : Colors.border}
                />
              </TouchableOpacity>
            ))}
          </View>
          {rating > 0 && (
            <Text style={styles.ratingLabel}>
              {ratingLabels[rating - 1]} ({rating}/5)
            </Text>
          )}
        </View>

        {/* Quick Rating Aspects */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Rate Specific Aspects</Text>
          {[
            { label: "Professionalism", icon: "briefcase-outline" },
            { label: "Work Quality", icon: "checkmark-done-outline" },
            { label: "Punctuality", icon: "time-outline" },
            { label: "Communication", icon: "chatbubble-outline" },
          ].map((aspect, idx) => (
            <View key={idx} style={styles.aspectRow}>
              <View style={styles.aspectInfo}>
                <Ionicons
                  name={aspect.icon as any}
                  size={20}
                  color={Colors.primary}
                  style={styles.aspectIcon}
                />
                <Text style={styles.aspectLabel}>{aspect.label}</Text>
              </View>
              <View style={styles.aspectStars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} style={styles.smallStarButton}>
                    <Ionicons
                      name={"star-outline"}
                      size={18}
                      color={Colors.border}
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
          <Text style={styles.subtitle}>
            Share your experience with other users
          </Text>
          <TextInput
            style={styles.reviewInput}
            placeholder="Tell us about your experience..."
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={4}
            value={review}
            onChangeText={setReview}
            maxLength={500}
          />
          <Text style={styles.characterCount}>
            {review.length}/500 characters
          </Text>
        </View>

        {/* Before & After Photos */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Before & After Photos (Optional)
          </Text>
          <Text style={styles.subtitle}>
            Photos help other users understand the work quality
          </Text>

          <View style={styles.photoRow}>
            <View style={styles.photoColumn}>
              <Text style={styles.photoLabel}>Before</Text>
              {beforePhoto ? (
                <View style={styles.photoPreview}>
                  <Image
                    source={{ uri: beforePhoto }}
                    style={styles.photoImage}
                  />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => handleRemovePhoto("before")}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.photoDashedBox}
                  onPress={() => handleAddPhoto("before")}
                >
                  <Ionicons
                    name="image-outline"
                    size={24}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.photoPlaceholderText}>Add photo</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.photoColumn}>
              <Text style={styles.photoLabel}>After</Text>
              {afterPhoto ? (
                <View style={styles.photoPreview}>
                  <Image
                    source={{ uri: afterPhoto }}
                    style={styles.photoImage}
                  />
                  <TouchableOpacity
                    style={styles.removePhotoButton}
                    onPress={() => handleRemovePhoto("after")}
                  >
                    <Ionicons name="close" size={16} color="white" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.photoDashedBox}
                  onPress={() => handleAddPhoto("after")}
                >
                  <Ionicons
                    name="image-outline"
                    size={24}
                    color={Colors.textSecondary}
                  />
                  <Text style={styles.photoPlaceholderText}>Add photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Anonymous Review Option */}
        <View style={styles.checkboxCard}>
          <View style={styles.checkboxRow}>
            <View style={styles.uncheckedBox} />
            <Text style={styles.checkboxLabel}>
              Post this review anonymously
            </Text>
          </View>
        </View>

        {/* Recommendation */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            Would you recommend this professional?
          </Text>
          <View style={styles.recommendationButtons}>
            <TouchableOpacity style={styles.recommendButton}>
              <Ionicons
                name="thumbs-up-outline"
                size={20}
                color={Colors.primary}
              />
              <Text style={styles.recommendText}>Yes, I would</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.recommendButton}>
              <Ionicons
                name="thumbs-down-outline"
                size={20}
                color={Colors.textSecondary}
              />
              <Text style={styles.recommendText}>No</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info */}
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={16}
            color={Colors.primary}
          />
          <Text style={styles.infoText}>
            Your feedback helps improve the quality of professionals on our
            platform.
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.submitButton, rating === 0 && { opacity: 0.6 }]}
          onPress={handleSubmitReview}
          disabled={rating === 0}
        >
          <Text style={styles.submitButtonText}>Submit Review</Text>
        </TouchableOpacity>
      </View>

      {/* Success Modal */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.successModalOverlay}>
          <View style={styles.successModal}>
            <View style={styles.successIcon}>
              <Ionicons
                name="checkmark-circle"
                size={60}
                color={Colors.primary}
              />
            </View>
            <Text style={styles.successTitle}>Thank You!</Text>
            <Text style={styles.successMessage}>
              Your review has been submitted successfully.
            </Text>
            <Text style={styles.successSubmessage}>
              Redirecting to bookings...
            </Text>
          </View>
        </View>
      </Modal>
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
    paddingBottom: 80,
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
  workerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workerImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  workerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 2,
  },
  jobTitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  ratingContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    marginBottom: 12,
  },
  starButton: {
    padding: 4,
  },
  ratingLabel: {
    textAlign: "center",
    fontSize: 13,
    fontWeight: "bold",
    color: Colors.primary,
    marginTop: 8,
  },
  aspectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  aspectInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  aspectIcon: {
    marginRight: 4,
  },
  aspectLabel: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "500",
  },
  aspectStars: {
    flexDirection: "row",
    gap: 6,
  },
  smallStarButton: {
    padding: 2,
  },
  reviewInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.text,
    textAlignVertical: "top",
    marginBottom: 8,
  },
  characterCount: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "right",
  },
  photoRow: {
    flexDirection: "row",
    gap: 12,
  },
  photoColumn: {
    flex: 1,
  },
  photoLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 8,
  },
  photoDashedBox: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.lightBackground,
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 6,
  },
  photoPreview: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: 150,
    borderRadius: 8,
  },
  removePhotoButton: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  uncheckedBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  checkboxLabel: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "500",
  },
  recommendationButtons: {
    flexDirection: "row",
    gap: 12,
  },
  recommendButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.lightBackground,
  },
  recommendText: {
    fontSize: 13,
    color: Colors.text,
    fontWeight: "500",
  },
  infoCard: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#E3F2FD",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#90CAF9",
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: "#1565C0",
    lineHeight: 14,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  successModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  successModal: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    width: "80%",
  },
  successIcon: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: Colors.primary,
    marginBottom: 10,
    textAlign: "center",
  },
  successMessage: {
    fontSize: 13,
    color: Colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  successSubmessage: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: "center",
  },
});
