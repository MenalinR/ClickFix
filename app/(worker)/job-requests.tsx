import DateTimePicker, {
    DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import { useVideoPlayer, VideoView } from "expo-video";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Dimensions,
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
import { SafeAreaView } from "react-native-safe-area-context";
import { api, apiCall, isVideoUrl, videoPosterUrl } from "../../constants/api";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";

// Plays a video inside the preview modal. Split out because useVideoPlayer
// is a hook and the modal only knows the URL once a thumbnail is tapped.
function VideoPreview({ uri }: { uri: string }) {
  const player = useVideoPlayer(uri, (p) => {
    p.play();
  });
  return (
    <VideoView
      player={player}
      style={styles.imagePreviewFull}
      contentFit="contain"
      nativeControls
    />
  );
}

const { width } = Dimensions.get("window");

export default function JobRequestsPage() {
  const router = useRouter();
  const {
    jobs,
    fetchJobs,
    acceptJob,
    updateJobStatus,
    cancelJob,
    proposeReschedule,
    token,
    user,
  } = useStore();
  const unreadCancelled = useStore((s) => s.unreadCancelled);
  const setUnreadCancelled = useStore((s) => s.setUnreadCancelled);
  const setLastSeenCancelled = useStore((s) => s.setLastSeenCancelled);
  const unreadJobs = useStore((s) => s.unreadJobs);
  const setUnreadJobs = useStore((s) => s.setUnreadJobs);
  const workerId = user?._id || (user as any)?.id;

  const JOB_NOTIFICATION_TYPES = [
    "JOB_ASSIGNED",
    "JOB_REQUESTED",
    "JOB_COMPLETED",
    "REVIEW_RECEIVED",
    "JOB_RESCHEDULE_RESPONDED",
    "GENERAL",
  ];

  const markCancelledAsRead = useCallback(async () => {
    if (!token || unreadCancelled === 0) return;
    setUnreadCancelled(0);
    setLastSeenCancelled(0);
    try {
      await apiCall(
        `${api.notifications.markAllAsRead}?types=JOB_CANCELLED`,
        "PUT",
        undefined,
        token,
      );
    } catch {
      // non-fatal
    }
  }, [token, unreadCancelled, setUnreadCancelled, setLastSeenCancelled]);
  const [filter, setFilter] = useState<
    "all" | "new" | "accepted" | "inprogress" | "completed" | "cancelled" | "rejected"
  >("all");
  const [loading, setLoading] = useState(true);
  const [priceInputs, setPriceInputs] = useState<Record<string, string>>({});
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [startingId, setStartingId] = useState<string | null>(null);
  const [hardwareRequests, setHardwareRequests] = useState<any[]>([]);
  const [rescheduleJobId, setRescheduleJobId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState(new Date());
  const [showRescheduleDate, setShowRescheduleDate] = useState(false);
  const [showRescheduleTime, setShowRescheduleTime] = useState(false);
  const [submittingReschedule, setSubmittingReschedule] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  const loadJobs = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetchJobs().finally(() => setLoading(false));
    apiCall(api.hardware.getRequests, "GET", undefined, token)
      .then((res) => {
        if (res.success) setHardwareRequests(res.data || []);
      })
      .catch(() => {
        // non-fatal
      });
    setLastSeenCancelled(unreadCancelled);
    if (unreadJobs > 0) {
      setUnreadJobs(0);
      apiCall(
        `${api.notifications.markAllAsRead}?types=${JOB_NOTIFICATION_TYPES.join(",")}`,
        "PUT",
        undefined,
        token,
      ).catch(() => {
        // non-fatal
      });
    }
  }, [token, unreadCancelled, unreadJobs]);

  useEffect(() => {
    loadJobs();
  }, [token]);

  // Most recent hardware request per job (backend returns newest first).
  const hardwareByJob: Record<string, any> = {};
  for (const r of hardwareRequests) {
    const jid = r.jobId?._id || r.jobId;
    if (jid && !hardwareByJob[jid]) hardwareByJob[jid] = r;
  }
  const pendingHardwareStatuses = [
    "pending",
    "approved",
    "packing",
    "ready",
    "coming",
  ];
  const hasPendingHardware = (id: string) =>
    pendingHardwareStatuses.includes(hardwareByJob[id]?.status);

  const jobList = Array.isArray(jobs) ? jobs : [];
  const statusOf = (j: any) => (j.status || "").toLowerCase();
  const isMine = (j: any) =>
    j.workerId?._id === workerId ||
    j.workerId === workerId ||
    j.requestedWorkerId?._id === workerId ||
    j.requestedWorkerId === workerId;
  const pendingJobs = jobList.filter((j) => statusOf(j) === "pending");
  const negotiatingJobs = jobList.filter(
    (j) => statusOf(j) === "negotiating" && isMine(j),
  );
  const awaitingCustomerJobs = jobList.filter(
    (j) => statusOf(j) === "worker accepted" && isMine(j),
  );
  const acceptedJobs = jobList.filter(
    (j) => statusOf(j) === "accepted" && isMine(j),
  );
  const onTheWayJobs = jobList.filter(
    (j) => statusOf(j) === "on the way" && isMine(j),
  );
  const inProgressJobs = jobList.filter(
    (j) => statusOf(j) === "in progress" && isMine(j),
  );
  const cancelledJobs = jobList.filter(
    (j) => statusOf(j) === "cancelled" && isMine(j),
  );
  const rejectedJobs = jobList.filter(
    (j) => statusOf(j) === "rejected" && isMine(j),
  );
  const completedJobs = jobList.filter(
    (j) => statusOf(j) === "completed" && isMine(j),
  );

  const activeJobs = [...onTheWayJobs, ...inProgressJobs];

  const displayedJobs =
    filter === "new"
      ? pendingJobs
      : filter === "accepted"
        ? [...negotiatingJobs, ...awaitingCustomerJobs, ...acceptedJobs, ...onTheWayJobs]
        : filter === "inprogress"
          ? inProgressJobs
          : filter === "completed"
            ? completedJobs
            : filter === "cancelled"
              ? cancelledJobs
              : filter === "rejected"
                ? rejectedJobs
                : [
                    ...pendingJobs,
                    ...activeJobs,
                    ...negotiatingJobs,
                    ...awaitingCustomerJobs,
                    ...acceptedJobs,
                    ...completedJobs,
                    ...cancelledJobs,
                    ...rejectedJobs,
                  ];

  const jobId = (j: any) => j._id || j.id;

  const handleAcceptJob = async (id: string, job: any) => {
    if (acceptingId) return;
    const raw = (priceInputs[id] || "").trim();
    const price = Number(raw);
    if (!raw || isNaN(price) || price <= 0) {
      Alert.alert("Price required", "Please enter a price before accepting.");
      return;
    }
    try {
      setAcceptingId(id);
      await acceptJob(id, price);
      setPriceInputs((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      Alert.alert("Success", "Job accepted! You can now chat with the customer.");
    } catch (e: any) {
      const msg = e?.message || "Failed to accept job.";
      if (msg.toLowerCase().includes("already assigned")) {
        // Someone else took it or we already accepted — resync silently
        await fetchJobs();
        Alert.alert(
          "Job no longer available",
          "This job was already assigned. The list has been refreshed.",
        );
      } else {
        Alert.alert("Error", msg);
      }
    } finally {
      setAcceptingId(null);
    }
  };

  const handleRejectJob = (id: string) => {
    updateJobStatus(id, "Rejected");
    Alert.alert("Job Rejected", "This job request has been rejected.");
  };

  const handleCancelJob = (id: string) => {
    Alert.alert(
      "Cancel job?",
      "Are you sure you want to cancel this job? The customer will be notified.",
      [
        { text: "Keep job", style: "cancel" },
        {
          text: "Cancel job",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelJob(id, "Cancelled by worker");
              Alert.alert("Cancelled", "The job has been cancelled.");
            } catch (e: any) {
              Alert.alert("Error", e?.message || "Failed to cancel job.");
            }
          },
        },
      ],
    );
  };

  const handleStartJob = async (id: string, customerName: string) => {
    if (hasPendingHardware(id)) {
      router.push({ pathname: "/hardware-updates" });
      return;
    }
    if (startingId) return;
    try {
      setStartingId(id);
      let location: { latitude: number; longitude: number } | undefined;
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (perm.granted) {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          location = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
        }
      } catch {
        // Non-fatal — the job still starts, just without a transport fee.
      }
      await updateJobStatus(id, "On the way", location);
      router.push({
        pathname: "/job-route",
        params: { jobId: id, customerName },
      });
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to start job.");
    } finally {
      setStartingId(null);
    }
  };

  const openRescheduleModal = (id: string) => {
    setRescheduleJobId(id);
    // Default to a day from now (not "right now") so the picker doesn't
    // open already sitting on a timestamp that expires within seconds.
    setRescheduleDate(new Date(Date.now() + 24 * 60 * 60 * 1000));
  };

  const closeRescheduleModal = () => {
    setRescheduleJobId(null);
  };

  const openRescheduleDatePicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: rescheduleDate,
        mode: "date",
        minimumDate: new Date(),
        onChange: (event, selected) => {
          if (event.type === "set" && selected) {
            setRescheduleDate((prev) => {
              const next = new Date(prev);
              next.setFullYear(
                selected.getFullYear(),
                selected.getMonth(),
                selected.getDate(),
              );
              return next;
            });
          }
        },
      });
    } else {
      setShowRescheduleDate(true);
    }
  };

  const openRescheduleTimePicker = () => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: rescheduleDate,
        mode: "time",
        onChange: (event, selected) => {
          if (event.type === "set" && selected) {
            setRescheduleDate((prev) => {
              const next = new Date(prev);
              next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
              return next;
            });
          }
        },
      });
    } else {
      setShowRescheduleTime(true);
    }
  };

  const handleRescheduleDateChange = (_event: any, selected?: Date) => {
    setShowRescheduleDate(Platform.OS === "ios");
    if (selected) {
      setRescheduleDate((prev) => {
        const next = new Date(prev);
        next.setFullYear(
          selected.getFullYear(),
          selected.getMonth(),
          selected.getDate(),
        );
        return next;
      });
    }
  };

  const handleRescheduleTimeChange = (_event: any, selected?: Date) => {
    setShowRescheduleTime(Platform.OS === "ios");
    if (selected) {
      setRescheduleDate((prev) => {
        const next = new Date(prev);
        next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        return next;
      });
    }
  };

  const submitReschedule = async () => {
    if (!rescheduleJobId || submittingReschedule) return;
    if (rescheduleDate.getTime() < Date.now() + 60 * 1000) {
      Alert.alert("Invalid time", "Please pick a time in the future.");
      return;
    }
    try {
      setSubmittingReschedule(true);
      await proposeReschedule(rescheduleJobId, rescheduleDate);
      closeRescheduleModal();
      Alert.alert(
        "Request sent",
        "The customer has been asked to approve the new time.",
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to request reschedule.");
    } finally {
      setSubmittingReschedule(false);
    }
  };

  const formatDate = (d: string | Date) => {
    if (!d) return "—";
    const date = typeof d === "string" ? new Date(d) : d;
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
          <TouchableOpacity onPress={loadJobs} disabled={loading}>
            <Ionicons name="refresh" size={24} color={Colors.primary} />
          </TouchableOpacity>
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
              Accepted ({[...negotiatingJobs, ...awaitingCustomerJobs, ...acceptedJobs, ...onTheWayJobs].length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === "inprogress" && styles.filterTabActive,
            ]}
            onPress={() => setFilter("inprogress")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "inprogress" && styles.filterTextActive,
              ]}
            >
              In Progress ({inProgressJobs.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === "completed" && styles.filterTabActive,
            ]}
            onPress={() => setFilter("completed")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "completed" && styles.filterTextActive,
              ]}
            >
              Completed ({completedJobs.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === "cancelled" && styles.filterTabActive,
            ]}
            onPress={() => {
              setFilter("cancelled");
              markCancelledAsRead();
            }}
          >
            <Text
              style={[
                styles.filterText,
                filter === "cancelled" && styles.filterTextActive,
              ]}
            >
              Cancelled ({cancelledJobs.length})
            </Text>
            {unreadCancelled > 0 ? (
              <View style={styles.cancelFilterBadge}>
                <Text style={styles.cancelFilterBadgeText}>
                  {unreadCancelled > 9 ? "9+" : unreadCancelled}
                </Text>
              </View>
            ) : null}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterTab,
              filter === "rejected" && styles.filterTabActive,
            ]}
            onPress={() => setFilter("rejected")}
          >
            <Text
              style={[
                styles.filterText,
                filter === "rejected" && styles.filterTextActive,
              ]}
            >
              Rejected ({rejectedJobs.length})
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
            const isCancelled = status === "cancelled";
            const isRejected = status === "rejected";
            const isOnTheWay = status === "on the way";
            const isInProgress = status === "in progress";
            const isCompleted = status === "completed";
            const j = job as any;
            const customerName = j.customerId?.name || "Customer";
            const customerAddress =
              j.location?.address ||
              j.customerId?.addresses?.find((a: any) => a.isDefault)
                ?.address ||
              j.customerId?.addresses?.[0]?.address ||
              "Address to be confirmed";
            const requestedDate = formatDate(j.scheduledDate || j.createdAt);
            const acceptedPrice =
              j.pricing?.serviceCharge ||
              j.pricing?.negotiatedPrice ||
              j.pricing?.proposedPrice ||
              Math.max(
                0,
                (j.pricing?.totalAmount || 0) -
                  (j.pricing?.hardwareCost || 0) -
                  (j.pricing?.transportFee || 0),
              );
            const proposedPrice = j.pricing?.proposedPrice ?? acceptedPrice;
            const negotiatedPrice = j.pricing?.negotiatedPrice ?? 0;
            const isOverdue =
              isAccepted &&
              j.scheduledDate &&
              new Date(j.scheduledDate).getTime() < Date.now();
            const isReschedulePending =
              j.reschedule?.status === "pending" &&
              j.reschedule?.proposedBy === "worker";
            let badgeColor = "#FFA500";
            let badgeLabel = "🔔 New";
            if (isCompleted) {
              badgeColor = "#388E3C";
              badgeLabel = "✓ Completed";
            } else if (isOverdue) {
              badgeColor = "#C62828";
              badgeLabel = "⚠ Overdue";
            } else if (isInProgress) {
              badgeColor = "#4CAF50";
              badgeLabel = "🔧 In Progress";
            } else if (isOnTheWay) {
              badgeColor = "#0288D1";
              badgeLabel = "🚗 On the Way";
            } else if (isAccepted) {
              badgeColor = "#4CAF50";
              badgeLabel = "✓ Accepted";
            } else if (isAwaiting) {
              badgeColor = "#F57F17";
              badgeLabel = "⏳ Awaiting Customer";
            } else if (isNegotiating) {
              badgeColor = "#1565C0";
              badgeLabel = "💬 Negotiating";
            } else if (isCancelled) {
              badgeColor = "#C62828";
              badgeLabel = "✕ Cancelled";
            } else if (isRejected) {
              badgeColor = "#C62828";
              badgeLabel = "✕ Rejected";
            }
            return (
              <View
                key={id}
                style={[
                  styles.jobCard,
                  isOverdue && styles.jobCardOverdue,
                ]}
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
                    <Text style={styles.detailText}>
                      <Text style={styles.detailLabel}>Booked for: </Text>
                      {requestedDate}
                    </Text>
                  </View>
                  {isOverdue && (
                    <View style={styles.detailItem}>
                      <Ionicons
                        name="alert-circle-outline"
                        size={16}
                        color="#C62828"
                      />
                      <Text style={styles.overdueText}>
                        This job's scheduled time has passed and it hasn't
                        been started yet.
                      </Text>
                    </View>
                  )}
                </View>

                {job.images && job.images.length > 0 && (
                  <View style={styles.imagesContainer}>
                    {job.images.slice(0, 2).map((image: string, idx: number) => {
                      const isVideo = isVideoUrl(image);
                      return (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => setPreviewImageUrl(image)}
                        >
                          <Image
                            source={{
                              uri: isVideo ? videoPosterUrl(image) : image,
                            }}
                            style={styles.jobImage}
                          />
                          {isVideo && (
                            <View style={styles.videoPlayBadge}>
                              <Ionicons
                                name="play"
                                size={14}
                                color="white"
                              />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
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
                ) : isRejected ? (
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Agreed Price:</Text>
                    <Text style={styles.priceValue}>0 LKR</Text>
                  </View>
                ) : (
                  <View style={styles.priceContainer}>
                    <Text style={styles.priceLabel}>Agreed Price:</Text>
                    <Text style={styles.priceValue}>{acceptedPrice} LKR</Text>
                  </View>
                )}

                {isPending && (
                  <>
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
                        style={[
                          styles.button,
                          styles.acceptButton,
                          acceptingId === id && { opacity: 0.5 },
                        ]}
                        onPress={() => handleAcceptJob(id, job)}
                        disabled={acceptingId !== null}
                      >
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={20}
                          color="white"
                        />
                        <Text style={styles.acceptButtonText}>Accept</Text>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[
                        styles.rescheduleButton,
                        isReschedulePending && styles.rescheduleButtonDisabled,
                      ]}
                      disabled={isReschedulePending}
                      onPress={() => openRescheduleModal(id)}
                    >
                      <Ionicons
                        name={
                          isReschedulePending ? "time-outline" : "calendar-outline"
                        }
                        size={18}
                        color={isReschedulePending ? "#8D6E63" : Colors.primary}
                      />
                      <Text
                        style={[
                          styles.rescheduleButtonText,
                          !isReschedulePending && { color: Colors.primary },
                        ]}
                      >
                        {isReschedulePending
                          ? "Time change requested"
                          : "Can't make this time? Change it"}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {(isAwaiting || isNegotiating) && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.button, styles.rejectButton]}
                      onPress={() => handleCancelJob(id)}
                    >
                      <Ionicons
                        name="close-circle-outline"
                        size={20}
                        color="#FF6B6B"
                      />
                      <Text style={styles.rejectButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, styles.chatButton]}
                      onPress={() =>
                        router.push({
                          pathname: "/chat",
                          params: {
                            jobId: id,
                            customerId:
                              j.customerId?._id || j.customerId || "",
                            customerName,
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
                  <>
                    <View style={styles.actionButtons}>
                      <TouchableOpacity
                        style={[styles.button, styles.rejectButton]}
                        onPress={() => handleCancelJob(id)}
                      >
                        <Ionicons
                          name="close-circle-outline"
                          size={20}
                          color="#FF6B6B"
                        />
                        <Text style={styles.rejectButtonText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.button, styles.chatButton]}
                        onPress={() =>
                          router.push({
                            pathname: "/chat",
                            params: {
                              jobId: id,
                              customerId:
                                (j.customerId?._id || j.customerId)?.toString?.() ||
                                j.customerId,
                              customerName,
                            },
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
                        style={[
                          styles.button,
                          styles.startButton,
                          (startingId === id ||
                            (isOverdue && !hasPendingHardware(id))) && {
                            opacity: 0.5,
                          },
                        ]}
                        disabled={
                          startingId !== null ||
                          (isOverdue && !hasPendingHardware(id))
                        }
                        onPress={() => handleStartJob(id, customerName)}
                      >
                        <Ionicons
                          name={
                            hasPendingHardware(id)
                              ? "cube-outline"
                              : "play-circle-outline"
                          }
                          size={20}
                          color="white"
                        />
                        <Text style={styles.startButtonText}>
                          {hasPendingHardware(id) ? "Hardware Pickup" : "Start Job"}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {isOverdue && (
                      <TouchableOpacity
                        style={[
                          styles.rescheduleButton,
                          isReschedulePending && styles.rescheduleButtonDisabled,
                        ]}
                        disabled={isReschedulePending}
                        onPress={() => openRescheduleModal(id)}
                      >
                        <Ionicons
                          name={
                            isReschedulePending
                              ? "time-outline"
                              : "calendar-outline"
                          }
                          size={18}
                          color={isReschedulePending ? "#8D6E63" : "#C62828"}
                        />
                        <Text
                          style={[
                            styles.rescheduleButtonText,
                            isReschedulePending && {
                              color: "#8D6E63",
                            },
                          ]}
                        >
                          {isReschedulePending
                            ? "Reschedule requested — waiting for customer"
                            : "Ask customer to reschedule"}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                )}

                {isOnTheWay && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.button, styles.startButton]}
                      onPress={() =>
                        router.push({
                          pathname: "/job-route",
                          params: { jobId: id, customerName },
                        })
                      }
                    >
                      <Ionicons name="navigate-outline" size={20} color="white" />
                      <Text style={styles.startButtonText}>Navigate</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {isInProgress && (
                  <View style={styles.actionButtons}>
                    <TouchableOpacity
                      style={[styles.button, styles.chatButton]}
                      onPress={() =>
                        router.push({
                          pathname: "/chat",
                          params: {
                            jobId: id,
                            customerId:
                              (j.customerId?._id || j.customerId)?.toString?.() ||
                              j.customerId,
                            customerName,
                          },
                        } as any)
                      }
                    >
                      <Ionicons name="chatbubble-outline" size={20} color="white" />
                      <Text style={styles.chatButtonText}>Chat</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: "#4CAF50" }]}
                      onPress={() =>
                        Alert.alert(
                          "Complete job?",
                          "Mark this job as completed?",
                          [
                            { text: "Not yet", style: "cancel" },
                            {
                              text: "Complete",
                              onPress: async () => {
                                try {
                                  await updateJobStatus(id, "Completed");
                                  Alert.alert("Done", "Job marked as completed.");
                                } catch (e: any) {
                                  Alert.alert("Error", e?.message || "Failed.");
                                }
                              },
                            },
                          ],
                        )
                      }
                    >
                      <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                      <Text style={styles.startButtonText}>Complete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal
        visible={rescheduleJobId !== null}
        transparent
        animationType="fade"
        onRequestClose={closeRescheduleModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Ask customer to reschedule</Text>
            <Text style={styles.modalSubtitle}>
              Pick the new date and time you&apos;d like to propose. The
              customer will need to approve it.
            </Text>

            <View style={styles.modalPickerRow}>
              <TouchableOpacity
                style={styles.modalPickerBtn}
                onPress={openRescheduleDatePicker}
              >
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.modalPickerText}>
                  {rescheduleDate.toLocaleDateString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPickerBtn}
                onPress={openRescheduleTimePicker}
              >
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={Colors.primary}
                />
                <Text style={styles.modalPickerText}>
                  {rescheduleDate.toLocaleTimeString("en-GB", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
              </TouchableOpacity>
            </View>

            {Platform.OS === "ios" && showRescheduleDate && (
              <DateTimePicker
                value={rescheduleDate}
                mode="date"
                minimumDate={new Date()}
                onChange={handleRescheduleDateChange}
              />
            )}
            {Platform.OS === "ios" && showRescheduleTime && (
              <DateTimePicker
                value={rescheduleDate}
                mode="time"
                onChange={handleRescheduleTimeChange}
              />
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancelButton]}
                onPress={closeRescheduleModal}
                disabled={submittingReschedule}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalConfirmButton]}
                onPress={submitReschedule}
                disabled={submittingReschedule}
              >
                {submittingReschedule ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.modalConfirmText}>Send request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        visible={!!previewImageUrl}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewImageUrl(null)}
      >
        <View style={styles.imagePreviewOverlay}>
          <TouchableOpacity
            style={styles.imagePreviewClose}
            onPress={() => setPreviewImageUrl(null)}
          >
            <Ionicons name="close-circle" size={32} color="white" />
          </TouchableOpacity>
          {previewImageUrl &&
            (isVideoUrl(previewImageUrl) ? (
              <VideoPreview uri={previewImageUrl} />
            ) : (
              <Image
                source={{ uri: previewImageUrl }}
                style={styles.imagePreviewFull}
                resizeMode="contain"
              />
            ))}
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
    flexWrap: "wrap",
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
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cancelFilterBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelFilterBadgeText: { color: "white", fontSize: 10, fontWeight: "700" },
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
  jobCardOverdue: {
    borderLeftColor: "#C62828",
    backgroundColor: "#FFF5F5",
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
  detailLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  overdueText: {
    fontSize: 12,
    color: "#C62828",
    fontWeight: "600",
    marginLeft: 8,
    flex: 1,
  },
  imagesContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  imagePreviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    justifyContent: "center",
    alignItems: "center",
  },
  imagePreviewClose: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  imagePreviewFull: {
    width: width,
    height: "80%",
  },
  jobImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  videoPlayBadge: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    justifyContent: "center",
    alignItems: "center",
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
  rescheduleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: "#EF9A9A",
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 10,
  },
  rescheduleButtonDisabled: {
    backgroundColor: "#EFEBE9",
    borderColor: "#D7CCC8",
  },
  rescheduleButtonText: {
    color: "#C62828",
    fontWeight: "600",
    fontSize: 13,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  modalPickerRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  modalPickerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.lightBackground,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    paddingVertical: 12,
  },
  modalPickerText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  modalButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  modalCancelButton: {
    backgroundColor: Colors.lightBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontWeight: "600",
    fontSize: 14,
  },
  modalConfirmButton: {
    backgroundColor: Colors.primary,
  },
  modalConfirmText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});
