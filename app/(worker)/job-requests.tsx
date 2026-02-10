import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
    Alert,
    Dimensions,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";

const { width } = Dimensions.get("window");

export default function JobRequestsPage() {
  const router = useRouter();
  const { jobs, updateJobStatus } = useStore();
  const workerId = "1"; // TODO: Replace with real logged-in worker's id
  const [filter, setFilter] = useState<"all" | "new" | "accepted">("all");

  const pendingJobs = jobs.filter((j) => j.status === "Pending");
  const acceptedJobs = jobs.filter(
    (j) => j.status === "Accepted" && j.workerId === workerId,
  );

  const displayedJobs =
    filter === "new"
      ? pendingJobs
      : filter === "accepted"
        ? acceptedJobs
        : [...pendingJobs, ...acceptedJobs];

  const handleAcceptJob = (jobId: string) => {
    updateJobStatus(jobId, "Accepted");
    Alert.alert("Success", "Job accepted! You can now chat with the customer.");
  };

  const handleRejectJob = (jobId: string) => {
    updateJobStatus(jobId, "Rejected");
    Alert.alert("Job Rejected", "This job request has been rejected.");
  };

  const handleViewDetails = (jobId: string) => {
    router.push({
      pathname: "/job-details",
      params: { jobId },
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
          <Text style={styles.heading}>Job Requests</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === "all" && styles.filterTabActive,
            ]}
            onPress={() => setFilter("all")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "all" && styles.filterTextActive,
              ]}
            >
              All ({displayedJobs.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === "new" && styles.filterTabActive,
            ]}
            onPress={() => setFilter("new")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "new" && styles.filterTextActive,
              ]}
            >
              New ({pendingJobs.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === "accepted" && styles.filterTabActive,
            ]}
            onPress={() => setFilter("accepted")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "accepted" && styles.filterTextActive,
              ]}
            >
              Accepted ({acceptedJobs.length})
            </Text>
          </TouchableOpacity>
        </View>

        {displayedJobs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons
              name="briefcase-outline"
              size={64}
              color={Colors.textSecondary}
            />
            <Text style={styles.emptyText}>No job requests at the moment</Text>
            <Text style={styles.emptySubText}>
              Check back soon for new opportunities!
            </Text>
          </View>
        ) : (
          displayedJobs.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.jobCard}
              onPress={() => handleViewDetails(job.id)}
            >
              <View style={styles.jobCardHeader}>
                <View>
                  <Text style={styles.customerName}>{job.customerName}</Text>
                  <Text style={styles.serviceType}>{job.serviceType}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor:
                        job.status === "Pending" ? "#FFA500" : "#4CAF50",
                    },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {job.status === "Pending" ? "🔔 New" : "✓ Accepted"}
                  </Text>
                </View>
              </View>

              <Text style={styles.description} numberOfLines={2}>
                {job.description}
              </Text>

              <View style={styles.jobDetails}>
                <View style={styles.detailItem}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={styles.detailText}>{job.location}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={styles.detailText}>{job.requestedDate}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons
                    name="time-outline"
                    size={16}
                    color={Colors.primary}
                  />
                  <Text style={styles.detailText}>{job.estimatedDuration}</Text>
                </View>
              </View>

              {job.images && job.images.length > 0 && (
                <View style={styles.imagesContainer}>
                  {job.images.slice(0, 2).map((image, idx) => (
                    <Image
                      key={idx}
                      source={{ uri: image }}
                      style={styles.jobImage}
                    />
                  ))}
                  {job.images.length > 2 && (
                    <View style={styles.moreImages}>
                      <Text style={styles.moreImagesText}>
                        +{job.images.length - 2}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.priceContainer}>
                <Text style={styles.priceLabel}>Estimated Price:</Text>
                <Text style={styles.priceValue}>{job.price} LKR</Text>
              </View>

              {job.status === "Pending" && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={() => handleRejectJob(job.id)}
                  >
                    <Ionicons
                      name="close-circle-outline"
                      size={20}
                      color="#FF6B6B"
                    />
                    <Text style={styles.rejectButtonText}>Reject</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.acceptButton]}
                    onPress={() => handleAcceptJob(job.id)}
                  >
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color="white"
                    />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                </View>
              )}

              {job.status === "Accepted" && (
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={[styles.button, styles.chatButton]}
                    onPress={() =>
                      router.push({
                        pathname: "/chat",
                        params: { jobId: job.id, customerId: job.customerId },
                      })
                    }
                  >
                    <Ionicons
                      name="chatbubble-outline"
                      size={20}
                      color="white"
                    />
                    <Text style={styles.chatButtonText}>Chat</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.button, styles.startButton]}
                    onPress={() =>
                      router.push({
                        pathname: "/job-details",
                        params: { jobId: job.id },
                      })
                    }
                  >
                    <Ionicons
                      name="play-circle-outline"
                      size={20}
                      color="white"
                    />
                    <Text style={styles.startButtonText}>Start Job</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  filterRow: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  filterTextActive: {
    color: "white",
  },
  jobCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  jobCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
  },
  serviceType: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "white",
  },
  description: {
    fontSize: 13,
    color: Colors.text,
    marginBottom: 12,
    lineHeight: 18,
  },
  jobDetails: {
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    fontSize: 12,
    color: Colors.text,
    marginLeft: 8,
  },
  imagesContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  jobImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  moreImages: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: Colors.lightBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  moreImagesText: {
    fontSize: 12,
    fontWeight: "bold",
    color: Colors.textSecondary,
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  priceLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  priceValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.primary,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 10,
  },
  button: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  acceptButton: {
    backgroundColor: Colors.primary,
  },
  acceptButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },
  rejectButton: {
    backgroundColor: "#FFE5E5",
    borderWidth: 1,
    borderColor: "#FF6B6B",
  },
  rejectButtonText: {
    color: "#FF6B6B",
    fontWeight: "600",
    fontSize: 13,
  },
  chatButton: {
    backgroundColor: "#2196F3",
  },
  chatButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },
  startButton: {
    backgroundColor: Colors.primary,
  },
  startButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: Colors.text,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 8,
  },
});
