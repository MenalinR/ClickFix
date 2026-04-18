import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
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
import { useStore } from "../../constants/Store";

const { width } = Dimensions.get("window");

export default function JobRequestsPage() {
  const router = useRouter();
  const { jobs, fetchJobs, acceptJob, updateJobStatus, token, user } = useStore();
  const workerId = user?._id || (user as any)?.id;
  const [filter, setFilter] = useState<"all" | "new" | "accepted">("all");
  const [loading, setLoading] = useState(true);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (token) {
      setLoading(true);
      fetchJobs().finally(() => setLoading(false));
    }
  }, [token]);

  const jobList = Array.isArray(jobs) ? jobs : [];
  const statusOf = (j: any) => (j.status || "").toLowerCase();
  const isMine = (j: any) =>
    j.workerId?._id === workerId || j.workerId === workerId;
  const pendingJobs = jobList.filter((j) => statusOf(j) === "pending");
  const awaitingCustomerJobs = jobList.filter(
    (j) =>
      (statusOf(j) === "worker accepted" || statusOf(j) === "negotiating") &&
      isMine(j),
  );
  const acceptedJobs = jobList.filter(
    (j) => statusOf(j) === "accepted" && isMine(j),
  );

  const displayedJobs =
    filter === "new"
      ? pendingJobs
      : filter === "accepted"
        ? [...awaitingCustomerJobs, ...acceptedJobs]
        : [...pendingJobs, ...awaitingCustomerJobs, ...acceptedJobs];

  const jobId = (j: any) => j._id || j.id;

  const handleAcceptJob = async (id: string) => {
    const raw = (priceInputs[id] || "").trim();
    const price = Number(raw);
    if (!raw || isNaN(price) || price <= 0) {
      Alert.alert("Price required", "Please enter a price before accepting.");
      return;
    }
    try {
      await acceptJob(id, price);
      setPriceInputs((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      Alert.alert("Success", "Job accepted! You can now chat with the customer.");
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to accept job.");
    }
  };

  const handleRejectJob = (id: string) => {
    updateJobStatus(id, "Rejected");
    Alert.alert("Job Rejected", "This job request has been rejected.");
  };

  const handleViewDetails = (id: string) => {
    router.push({
      pathname: "/job-details",
      params: { jobId: id },
    });
  };

  const formatDate = (d: string | Date) => {
    if (!d) return "—";
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
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

        {loading ? (
          <View style={styles.emptyContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : displayedJobs.length === 0 ? (
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
          displayedJobs.map((job) => {
            const id = jobId(job);
            const status = (job.status || "").toLowerCase();
            const isPending = status === "pending";
            const isAccepted = status === "accepted";
            const isAwaiting = status === "worker accepted";
            const isNegotiating = status === "negotiating";
            const j = job as any;
            const customerName = j.customerId?.name || "Customer";
            const customerAddress =
              j.customerId?.addresses?.[0]?.address ||
              j.location?.address ||
              "Address to be confirmed";
            const requestedDate = formatDate(j.createdAt || j.scheduledDate);
            const duration = j.estimatedDuration != null ? `${j.estimatedDuration} min` : "—";
            const acceptedPrice =
              j.pricing?.totalAmount ?? j.pricing?.serviceCharge ?? 0;
            const proposedPrice = j.pricing?.proposedPrice ?? acceptedPrice;
            const negotiatedPrice = j.pricing?.negotiatedPrice ?? 0;
            let badgeColor = "#FFA500";
            let badgeLabel = "🔔 New";
            if (isAccepted) {
              badgeColor = "#4CAF50";
              badgeLabel = "✓ Accepted";
            } else if (isAwaiting) {
              badgeColor = "#F57F17";
              badgeLabel = "⏳ Awaiting Customer";
            } else if (isNegotiating) {
              badgeColor = "#1565C0";
              badgeLabel = "💬 Negotiating";
            }
            return (
              <TouchableOpacity
                key={id}
                style={styles.jobCard}
                onPress={() => handleViewDetails(id)}
              >
                <View style={styles.jobCardHeader}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.customerName}>{customerName}</Text>
                    <Text style={styles.serviceType} numberOfLines={2}>
                      {customerAddress}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: badgeColor },
                    ]}
                  >
                    <Text style={styles.statusText}>{badgeLabel}</Text>
                  </View>
                </View>

                <Text style={styles.description} numberOfLines={2}>
                  {job.description}
                </Text>

                <View style={styles.jobDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons
                      name="calendar-outline"
                      size={16}
                      color={Colors.primary}
                    />
                    <Text style={styles.detailText}>{requestedDate}</Text>
                  </View>
                  <View style={styles.detailItem}>
                    <Ionicons
                      name="time-outline"
                      size={16}
                      color={Colors.primary}
                    />
                    <Text style={styles.detailText}>{duration}</Text>
                  </View>
                </View>

                {job.images && job.images.length > 0 && (
                  <View style={styles.imagesContainer}>
                    {job.images.slice(0, 2).map((image: string, idx: number) => (
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

                {isPending ? (
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Your Price:</Text>
                    <View style={styles.priceInputWrap}>
                      <TextInput
                        style={styles.priceInput}
                        placeholder="0"
                        placeholderTextColor={Colors.textSecondary}
                        keyboardType="numeric"
                        value={priceInputs[id] || ""}
                        onChangeText={(text) =>
                          setPriceInputs((prev) => ({
                            ...prev,
                            [id]: text.replace(/[^0-9.]/g, ""),
                          }))
                        }
                      />
                      <Text style={styles.priceCurrency}>LKR</Text>
                    </View>
                  </View>
                ) : isAwaiting ? (
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>You proposed:</Text>
                    <Text style={styles.priceValue}>{proposedPrice} LKR</Text>
                  </View>
                ) : isNegotiating ? (
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>
                      {negotiatedPrice ? "Customer offered:" : "You proposed:"}
                    </Text>
                    <Text style={styles.priceValue}>
                      {(negotiatedPrice || proposedPrice) + " LKR"}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Agreed Price:</Text>
                    <Text style={styles.priceValue}>{acceptedPrice} LKR</Text>
                  </View>
                )}

                {isPending && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.button, styles.rejectButton]}
                      onPress={() => handleRejectJob(id)}
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
                      onPress={() => handleAcceptJob(id)}
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

                {(isAwaiting || isNegotiating) && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.button, styles.chatButton]}
                      onPress={() =>
                        router.push({
                          pathname: "/chat",
                          params: {
                            jobId: id,
                            customerId:
                              j.customerId?._id || j.customerId || "",
                          },
                        } as any)
                      }
                    >
                      <Ionicons
                        name="chatbubble-outline"
                        size={20}
                        color="white"
                      />
                      <Text style={styles.chatButtonText}>Open Chat</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {isAccepted && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.button, styles.chatButton]}
                      onPress={() =>
                        router.push({
                          pathname: "/chat",
                          params: { jobId: id, customerId: (job.customerId?._id || job.customerId)?.toString?.() || job.customerId },
                        } as any)
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
                          params: { jobId: id },
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
            );
          })
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
  priceInputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    minWidth: 120,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 6,
    fontSize: 14,
    color: Colors.text,
    textAlign: "right",
  },
  priceCurrency: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "600",
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
