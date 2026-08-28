import { JobReviewActions } from "@/components/JobReviewActions";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { api, apiCall } from "../../../constants/api";
import {
    ActivityIndicator,
    Alert,
    Image,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../../constants/Colors";
import { useStore } from "../../../constants/Store";

type BookingFilter =
  | "All"
  | "Pending"
  | "Completed"
  | "Cancelled"
  | "Rejected"
  | "Denied";

export default function BookingsScreen() {
  const router = useRouter();
  const { jobs, fetchJobs, token, customerRespondToJob, cancelJob, respondToReschedule } =
    useStore();
  const [selectedFilter, setSelectedFilter] = useState<BookingFilter>("All");
  const [loading, setLoading] = useState(true);
  const [reviewJob, setReviewJob] = useState<any | null>(null);
  const [rescheduleReviewJob, setRescheduleReviewJob] = useState<any | null>(
    null,
  );
  const [respondingReschedule, setRespondingReschedule] = useState(false);
  const unreadCancelled = useStore((s) => s.unreadCancelled);
  const setUnreadCancelled = useStore((s) => s.setUnreadCancelled);
  const setLastSeenCancelled = useStore((s) => s.setLastSeenCancelled);
  const unreadReschedule = useStore((s) => s.unreadReschedule);
  const setUnreadReschedule = useStore((s) => s.setUnreadReschedule);

  const fetchUnreadCancelled = useCallback(async () => {
    if (!token) return;
    try {
      const res = await apiCall(
        `${api.notifications.getUnreadCount}?types=JOB_CANCELLED`,
        "GET",
        undefined,
        token,
      );
      setUnreadCancelled(res?.count || 0);
    } catch {
      // non-fatal
    }
  }, [token, setUnreadCancelled]);

  // Called when the user actually views the Cancelled filter — marks
  // notifications as read on the server and clears BOTH badges.
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

  // Called when the user opens the Bookings tab — dismisses the bottom-nav
  // badge only, without touching the filter badge or server state.
  const dismissBookingsTabBadge = useCallback(() => {
    setLastSeenCancelled(unreadCancelled);
  }, [unreadCancelled, setLastSeenCancelled]);

  const markRescheduleAsRead = useCallback(async () => {
    if (!token || unreadReschedule === 0) return;
    setUnreadReschedule(0);
    try {
      await apiCall(
        `${api.notifications.markAllAsRead}?types=JOB_RESCHEDULE_PROPOSED`,
        "PUT",
        undefined,
        token,
      );
    } catch {
      // non-fatal
    }
  }, [token, unreadReschedule, setUnreadReschedule]);

  useEffect(() => {
    fetchUnreadCancelled();
  }, [fetchUnreadCancelled]);

  const loadBookings = useCallback(() => {
    if (!token) return;
    setLoading(true);
    fetchJobs().finally(() => setLoading(false));
    dismissBookingsTabBadge();
    markRescheduleAsRead();
  }, [token, fetchJobs, dismissBookingsTabBadge, markRescheduleAsRead]);

  const handleApprove = async (jobId: string) => {
    await customerRespondToJob(jobId, "approve");
    setReviewJob(null);
  };
  const handleDeny = async (jobId: string) => {
    await customerRespondToJob(jobId, "deny");
    setReviewJob(null);
  };
  const handleCancel = (jobId: string) => {
    Alert.alert(
      "Cancel booking?",
      "Are you sure you want to cancel this booking? This cannot be undone.",
      [
        { text: "Keep booking", style: "cancel" },
        {
          text: "Cancel booking",
          style: "destructive",
          onPress: async () => {
            try {
              await cancelJob(jobId, "Cancelled by customer");
              Alert.alert("Cancelled", "Your booking has been cancelled.");
            } catch (e: any) {
              Alert.alert(
                "Error",
                e?.message || "Failed to cancel booking.",
              );
            }
          },
        },
      ],
    );
  };

  const handleRescheduleResponse = async (action: "accept" | "decline") => {
    if (!rescheduleReviewJob || respondingReschedule) return;
    const jobId = rescheduleReviewJob._id || rescheduleReviewJob.id;
    try {
      setRespondingReschedule(true);
      await respondToReschedule(jobId, action);
      setRescheduleReviewJob(null);
      Alert.alert(
        action === "accept" ? "Time updated" : "Request declined",
        action === "accept"
          ? "The new time has been confirmed with the worker."
          : "The worker has been notified.",
      );
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Failed to respond.");
    } finally {
      setRespondingReschedule(false);
    }
  };

  const handleNegotiate = async (jobId: string) => {
    const job: any = (jobs as any[]).find(
      (j) => (j._id || j.id) === jobId,
    );
    setReviewJob(null);
    router.push({
      pathname: "/(customer)/chat",
      params: {
        jobId,
        workerId:
          (job?.workerId as any)?._id || (job?.workerId as any) || "",
        workerName: (job?.workerId as any)?.name || "",
        customerId:
          (job?.customerId as any)?._id || (job?.customerId as any) || "",
      },
    });
  };

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [loadBookings]),
  );

  const bookings = useMemo(() => (Array.isArray(jobs) ? jobs : []), [jobs]);

  const filteredBookings = useMemo(() => {
    if (selectedFilter === "All") return bookings;
    const status = selectedFilter.toLowerCase();
    return bookings.filter((j) => (j.status || "").toLowerCase() === status);
  }, [bookings, selectedFilter]);

  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "completed") return { background: "#E8F5E9", text: "#2E7D32" };
    if (s === "cancelled" || s === "rejected" || s === "denied")
      return { background: "#FFEBEE", text: "#C62828" };
    if (s === "worker accepted")
      return { background: "#FFF8E1", text: "#F57F17" };
    if (s === "negotiating")
      return { background: "#E3F2FD", text: "#1565C0" };
    if (s === "pending" || s === "accepted" || s === "on the way" || s === "in progress")
      return { background: "#FFF3E0", text: "#E65100" };
    return { background: Colors.lightBackground, text: Colors.primary };
  };

  const getStatusLabel = (status: string) => {
    if (status === "Worker Accepted") return "Needs Review";
    return status || "Pending";
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

  const workerName = (job: any) =>
    job?.workerId?.name || job?.requestedWorkerId?.name || "—";
  const workerImage = (job: any) =>
    job?.workerId?.image || job?.requestedWorkerId?.image || "";
  const amount = (job: any) => {
    const status = (job?.status || "").toLowerCase();
    const p = job?.pricing || {};
    if (status === "pending") return 0;
    if (status === "negotiating") {
      return p.negotiatedPrice || p.proposedPrice || 0;
    }
    if (!p.proposedPrice && !p.negotiatedPrice) return 0;
    return p.negotiatedPrice || p.totalAmount || p.serviceCharge || p.proposedPrice || 0;
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
          <Text style={styles.heading}>Booking History</Text>
          <TouchableOpacity onPress={loadBookings} disabled={loading}>
            <Ionicons name="refresh" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          {(
            [
              "All",
              "Pending",
              "Completed",
              "Cancelled",
              "Rejected",
              "Denied",
            ] as BookingFilter[]
          ).map(
            (filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => {
                  setSelectedFilter(filter);
                  if (filter === "Cancelled") markCancelledAsRead();
                }}
                style={[
                  styles.filterTab,
                  selectedFilter === filter && styles.filterTabActive,
                ]}
              >
                <Text
                  style={[
                    styles.filterTabText,
                    selectedFilter === filter && styles.filterTabTextActive,
                  ]}
                >
                  {filter}
                </Text>
                {filter === "Cancelled" && unreadCancelled > 0 ? (
                  <View style={styles.filterBadge}>
                    <Text style={styles.filterBadgeText}>
                      {unreadCancelled > 9 ? "9+" : unreadCancelled}
                    </Text>
                  </View>
                ) : null}
              </TouchableOpacity>
            ),
          )}
        </View>

        {/* Summary Stats */}
        {selectedFilter === "All" && !loading && (
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Bookings</Text>
              <Text style={styles.statValue}>{bookings.length}</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statLabel}>Total Spent</Text>
              <Text style={styles.statValue}>
                {bookings.reduce((sum, b) => sum + amount(b), 0)} LKR
              </Text>
            </View>
          </View>
        )}

        {/* Bookings List */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : filteredBookings.length > 0 ? (
          <View style={styles.bookingsList}>
              {filteredBookings.map((job) => {
                const id = job._id || job.id;
                const status = (job.status || "Pending") as string;
                const colors = getStatusColor(status);
                const needsReview = status === "Worker Accepted";
                const needsRescheduleReview =
                  (job as any).reschedule?.status === "pending" &&
                  (job as any).reschedule?.proposedBy === "worker";
                const cancellableStatuses = [
                  "pending",
                  "negotiating",
                  "accepted",
                  "on the way",
                ];
                const canCancel = cancellableStatuses.includes(
                  status.toLowerCase(),
                );
                const canTrack = ["on the way", "in progress"].includes(
                  status.toLowerCase(),
                );
                const canChat =
                  !!job.workerId &&
                  ["accepted", "on the way", "in progress"].includes(
                    status.toLowerCase(),
                  );
                const isCompleted = status.toLowerCase() === "completed";
                const isTappable =
                  needsReview || needsRescheduleReview || canCancel;
                const RowWrap: any = isTappable ? TouchableOpacity : View;
                const onRowPress = needsRescheduleReview
                  ? () => setRescheduleReviewJob(job)
                  : needsReview
                    ? () => setReviewJob(job)
                    : canCancel
                      ? () => handleCancel(id)
                      : undefined;
                return (
                  <RowWrap
                    key={id}
                    style={styles.bookingCard}
                    onPress={onRowPress}
                  >
                    <View style={styles.bookingCardHeader}>
                      {workerImage(job) ? (
                        <Image
                          source={{ uri: workerImage(job) }}
                          style={styles.bookingCardWorkerImage}
                        />
                      ) : (
                        <View style={styles.bookingCardWorkerImagePlaceholder}>
                          <Ionicons
                            name="person"
                            size={20}
                            color={Colors.textSecondary}
                          />
                        </View>
                      )}
                      <View style={{ flex: 1 }}>
                        <Text style={styles.bookingCardWorkerName}>
                          {workerName(job)}
                        </Text>
                        <Text style={styles.bookingCardService}>
                          {job.serviceType || "—"}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, { backgroundColor: colors.background }]}>
                        <Text style={[styles.statusText, { color: colors.text }]}>
                          {getStatusLabel(status)}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.bookingCardDate}>
                      {formatDate((job as any).scheduledDate || (job as any).createdAt)}
                    </Text>

                    {!!(job as any).description && (
                      <Text style={styles.bookingCardIssue} numberOfLines={2}>
                        {(job as any).description}
                      </Text>
                    )}

                    {needsRescheduleReview && (
                      <View style={styles.rescheduleBadge}>
                        <Ionicons
                          name="calendar-outline"
                          size={12}
                          color="#8D6E63"
                        />
                        <Text style={styles.rescheduleBadgeText}>
                          New time requested
                        </Text>
                      </View>
                    )}

                    <View style={styles.bookingCardFooter}>
                      <Text style={styles.bookingCardAmount}>
                        {amount(job) ? `${amount(job)} LKR` : "—"}
                      </Text>
                      <View style={styles.actionIconsRow}>
                        {canChat ? (
                          <TouchableOpacity
                            style={styles.chatIconBtn}
                            onPress={() =>
                              router.push({
                                pathname: "/(customer)/chat",
                                params: {
                                  jobId: id,
                                  workerId:
                                    (job.workerId as any)?._id ||
                                    (job.workerId as any) ||
                                    "",
                                  workerName: workerName(job),
                                },
                              })
                            }
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons
                              name="chatbubble-outline"
                              size={20}
                              color={Colors.primary}
                            />
                          </TouchableOpacity>
                        ) : null}
                        {canTrack ? (
                          <TouchableOpacity
                            style={styles.trackIconBtn}
                            onPress={() =>
                              router.push({
                                pathname: "/(customer)/job-tracking",
                                params: {
                                  jobId: id,
                                  workerId:
                                    (job.workerId as any)?._id ||
                                    (job.workerId as any) ||
                                    "",
                                },
                              })
                            }
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons
                              name={
                                status.toLowerCase() === "in progress"
                                  ? "checkmark-circle"
                                  : "navigate-circle"
                              }
                              size={22}
                              color={Colors.primary}
                            />
                          </TouchableOpacity>
                        ) : null}
                        {isCompleted && job.payment?.status !== "completed" ? (
                          <TouchableOpacity
                            style={styles.payIconBtn}
                            onPress={() =>
                              router.push({
                                pathname: "/(customer)/payment",
                                params: {
                                  jobId: id,
                                  workerName: workerName(job),
                                  amount: String(amount(job)),
                                },
                              } as any)
                            }
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons name="card" size={20} color={Colors.primary} />
                          </TouchableOpacity>
                        ) : null}
                        {isCompleted ? (
                          <>
                            <TouchableOpacity
                              style={styles.reviewIconBtn}
                              onPress={() =>
                                router.push({
                                  pathname: "/(customer)/rating-review",
                                  params: {
                                    jobId: id,
                                    workerId:
                                      (job.workerId as any)?._id ||
                                      (job.workerId as any) ||
                                      "",
                                    workerName: workerName(job),
                                    workerImage: workerImage(job),
                                    serviceType: job.serviceType || "",
                                  },
                                } as any)
                              }
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="star" size={20} color="#FFA000" />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.complaintIconBtn}
                              onPress={() =>
                                router.push({
                                  pathname: "/(customer)/complaint",
                                  params: {
                                    workerId:
                                      (job.workerId as any)?._id ||
                                      (job.workerId as any) ||
                                      "",
                                    workerName: workerName(job),
                                    jobId: id,
                                    serviceType: job.serviceType || "",
                                  },
                                } as any)
                              }
                              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                              <Ionicons name="flag" size={18} color="#C62828" />
                            </TouchableOpacity>
                          </>
                        ) : null}
                        {canCancel ? (
                          <TouchableOpacity
                            style={styles.cancelIconBtn}
                            onPress={() => handleCancel(id)}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          >
                            <Ionicons
                              name="close-circle"
                              size={20}
                              color="#C62828"
                            />
                          </TouchableOpacity>
                        ) : null}
                      </View>
                    </View>
                  </RowWrap>
                );
              })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color={Colors.border} />
            <Text style={styles.emptyStateText}>No bookings yet</Text>
            <Text style={styles.emptyStateSubtext}>
              Your {selectedFilter.toLowerCase()} bookings will appear here
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={!!reviewJob}
        transparent
        animationType="fade"
        onRequestClose={() => setReviewJob(null)}
      >
        <View style={styles.reviewOverlay}>
          <View style={styles.reviewSheet}>
            <View style={styles.reviewSheetHeader}>
              <Text style={styles.reviewSheetTitle}>Review proposed price</Text>
              <TouchableOpacity onPress={() => setReviewJob(null)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            {reviewJob && (
              <>
                <Text style={styles.reviewSheetWorker}>
                  {workerName(reviewJob)} · {reviewJob.serviceType}
                </Text>
                {!!reviewJob.description && (
                  <Text style={styles.reviewSheetDesc}>
                    {reviewJob.description}
                  </Text>
                )}
                <View style={styles.reviewSheetPriceBox}>
                  <Text style={styles.reviewSheetPriceLabel}>
                    Proposed price
                  </Text>
                  <Text style={styles.reviewSheetPriceValue}>
                    {reviewJob.pricing?.proposedPrice ??
                      reviewJob.pricing?.totalAmount ??
                      reviewJob.pricing?.serviceCharge ??
                      0}{" "}
                    LKR
                  </Text>
                </View>
                <JobReviewActions
                  job={reviewJob}
                  onApprove={handleApprove}
                  onNegotiate={handleNegotiate}
                  onDeny={handleDeny}
                />
              </>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!rescheduleReviewJob}
        transparent
        animationType="fade"
        onRequestClose={() => setRescheduleReviewJob(null)}
      >
        <View style={styles.reviewOverlay}>
          <View style={styles.reviewSheet}>
            <View style={styles.reviewSheetHeader}>
              <Text style={styles.reviewSheetTitle}>Reschedule request</Text>
              <TouchableOpacity onPress={() => setRescheduleReviewJob(null)}>
                <Ionicons name="close" size={22} color={Colors.text} />
              </TouchableOpacity>
            </View>
            {rescheduleReviewJob && (
              <>
                <Text style={styles.reviewSheetWorker}>
                  {workerName(rescheduleReviewJob)} ·{" "}
                  {rescheduleReviewJob.serviceType}
                </Text>
                <Text style={styles.reviewSheetDesc}>
                  Your worker asked to move this job to a new time.
                </Text>
                <View style={styles.reviewSheetPriceBox}>
                  <Text style={styles.reviewSheetPriceLabel}>
                    Proposed new time
                  </Text>
                  <Text style={styles.reviewSheetDateValue}>
                    {formatDate(
                      (rescheduleReviewJob as any).reschedule?.proposedDate,
                    )}
                  </Text>
                </View>
                <View style={styles.rescheduleActionsRow}>
                  <TouchableOpacity
                    style={[styles.rescheduleActionBtn, styles.declineBtn]}
                    disabled={respondingReschedule}
                    onPress={() => handleRescheduleResponse("decline")}
                  >
                    {respondingReschedule ? (
                      <ActivityIndicator size="small" color="#C62828" />
                    ) : (
                      <>
                        <Ionicons
                          name="close-circle-outline"
                          size={18}
                          color="#C62828"
                        />
                        <Text style={styles.declineBtnText}>Decline</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.rescheduleActionBtn, styles.acceptBtn]}
                    disabled={respondingReschedule}
                    onPress={() => handleRescheduleResponse("accept")}
                  >
                    {respondingReschedule ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={18}
                          color="white"
                        />
                        <Text style={styles.acceptBtnText}>Accept</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
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
  filterContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 20,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  filterBadge: {
    backgroundColor: "#EF4444",
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: { color: "white", fontSize: 10, fontWeight: "700" },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    color: Colors.text,
    fontWeight: "600",
  },
  filterTabTextActive: {
    color: "white",
  },
  statsContainer: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.primary,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 12,
  },
  workerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  bookingInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 2,
  },
  serviceType: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  date: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  cardRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  amount: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "flex-start",
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  ratingDisplay: {
    flex: 1,
  },
  starsRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  ratingText: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  rateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    backgroundColor: Colors.lightBackground,
  },
  rateButtonText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },
  chatButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 8,
    borderRadius: 6,
    backgroundColor: Colors.lightBackground,
  },
  detailsButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  browseButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  browseButtonText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  reviewOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  reviewSheet: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 400,
  },
  reviewSheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  reviewSheetTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.text,
  },
  reviewSheetWorker: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 6,
  },
  reviewSheetDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  reviewSheetPriceBox: {
    backgroundColor: Colors.lightBackground,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 4,
  },
  reviewSheetPriceLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  reviewSheetPriceValue: {
    fontSize: 22,
    fontWeight: "700",
    color: Colors.primary,
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: "center",
  },
  bookingsList: {
    gap: 12,
  },
  bookingCard: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 8,
  },
  bookingCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bookingCardWorkerImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    flexShrink: 0,
  },
  bookingCardWorkerImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    flexShrink: 0,
    backgroundColor: Colors.lightBackground,
    justifyContent: "center",
    alignItems: "center",
  },
  bookingCardWorkerName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text,
  },
  bookingCardService: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bookingCardDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  bookingCardIssue: {
    fontSize: 13,
    color: Colors.text,
    lineHeight: 18,
  },
  bookingCardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 4,
  },
  bookingCardAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },
  actionIconsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cancelIconBtn: {
    padding: 2,
  },
  trackIconBtn: {
    padding: 2,
  },
  chatIconBtn: {
    padding: 2,
  },
  reviewIconBtn: {
    padding: 2,
  },
  payIconBtn: {
    padding: 2,
  },
  complaintIconBtn: {
    padding: 2,
  },
  rescheduleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#EFEBE9",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  rescheduleBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#8D6E63",
  },
  reviewSheetDateValue: {
    fontSize: 18,
    fontWeight: "700",
    color: Colors.primary,
  },
  rescheduleActionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  rescheduleActionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
  },
  declineBtn: {
    backgroundColor: "#FFEBEE",
    borderWidth: 1,
    borderColor: "#EF9A9A",
  },
  declineBtnText: {
    color: "#C62828",
    fontWeight: "600",
    fontSize: 14,
  },
  acceptBtn: {
    backgroundColor: Colors.primary,
  },
  acceptBtnText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
});
