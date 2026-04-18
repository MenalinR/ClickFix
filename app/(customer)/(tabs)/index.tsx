import { JobReviewActions } from "@/components/JobReviewActions";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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
import { Colors } from "../../../constants/Colors";
import { api, apiCall } from "../../../constants/api";
import { useStore } from "../../../constants/Store";

export default function CustomerHome() {
  const router = useRouter();
  const { jobs, fetchJobs, token, customerRespondToJob } = useStore();
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  const toReviewJobs = (Array.isArray(jobs) ? jobs : []).filter(
    (j: any) => ((j.status || "") as string).toLowerCase() === "worker accepted",
  );

  const loadApprovedWorkers = React.useCallback(async () => {
    try {
      setLoading(true);
      setFetchError("");
      const response = await apiCall(
        `${api.workers.getAll}?approved=true`,
        "GET",
      );
      const mappedWorkers = (response?.data || []).map((worker: any) => ({
        ...worker,
        id: worker.id || worker._id,
        image: worker.image || "https://via.placeholder.com/150",
      }));
      setWorkers(mappedWorkers);
    } catch (error: any) {
      setFetchError(error.message || "Failed to load workers");
      setWorkers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApprovedWorkers();
  }, []);

  useEffect(() => {
    if (token) fetchJobs();
  }, [token]);

  useFocusEffect(
    React.useCallback(() => {
      loadApprovedWorkers();
      if (token) fetchJobs();
    }, [loadApprovedWorkers, token]),
  );

  const handleApprove = async (jobId: string) => {
    await customerRespondToJob(jobId, "approve");
  };
  const handleDeny = async (jobId: string) => {
    await customerRespondToJob(jobId, "deny");
  };
  const handleNegotiate = async (jobId: string, counterPrice?: number) => {
    await customerRespondToJob(jobId, "negotiate", counterPrice);
    const job: any = (jobs as any[]).find(
      (j) => (j._id || j.id) === jobId,
    );
    const customerId = (job?.customerId as any)?._id || job?.customerId;
    router.push({
      pathname: "/(customer)/chat",
      params: {
        jobId,
        workerId:
          (job?.workerId as any)?._id || (job?.workerId as any) || "",
        customerId: customerId ? String(customerId) : "",
      },
    });
  };

  const filteredWorkers = workers.filter((w) => {
    const matchesSearch =
      (w.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (w.category || "").toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" || w.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => router.dismissAll()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.heading}>Find Services</Text>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons
            name="search"
            size={20}
            color={Colors.textSecondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for plumbers, electricians..."
            placeholderTextColor={Colors.textSecondary}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* DEBUG: job fetch diagnostic (remove later) */}
        <View
          style={{
            backgroundColor: "#FFF8E1",
            padding: 8,
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontSize: 11, color: "#E65100" }}>
            DEBUG · total jobs: {(Array.isArray(jobs) ? jobs : []).length} · to
            review: {toReviewJobs.length}
          </Text>
          <Text style={{ fontSize: 10, color: "#E65100" }}>
            statuses:{" "}
            {(Array.isArray(jobs) ? jobs : [])
              .map((j: any) => j.status)
              .join(", ") || "—"}
          </Text>
          <TouchableOpacity
            style={{
              marginTop: 6,
              alignSelf: "flex-start",
              backgroundColor: "#E65100",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 4,
            }}
            onPress={() => token && fetchJobs()}
          >
            <Text style={{ color: "white", fontSize: 11, fontWeight: "600" }}>
              Refresh jobs
            </Text>
          </TouchableOpacity>
        </View>

        {/* To Review (worker proposed a price, awaiting customer decision) */}
        {toReviewJobs.length > 0 && (
          <View style={styles.toReviewSection}>
            <Text style={styles.sectionTitle}>To Review</Text>
            {toReviewJobs.map((job: any) => {
              const id = job._id || job.id;
              const workerLabel =
                job.workerId?.name ||
                job.requestedWorkerId?.name ||
                "Worker";
              const proposedPrice =
                job.pricing?.proposedPrice ??
                job.pricing?.totalAmount ??
                job.pricing?.serviceCharge ??
                0;
              return (
                <View key={id} style={styles.reviewCard}>
                  <View style={styles.reviewCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.reviewWorker}>{workerLabel}</Text>
                      <Text style={styles.reviewService}>
                        {job.serviceType}
                      </Text>
                      {!!job.description && (
                        <Text style={styles.reviewDesc} numberOfLines={2}>
                          {job.description}
                        </Text>
                      )}
                    </View>
                    <View style={styles.reviewPriceBox}>
                      <Text style={styles.reviewPriceLabel}>Proposed</Text>
                      <Text style={styles.reviewPriceValue}>
                        {proposedPrice} LKR
                      </Text>
                    </View>
                  </View>
                  <JobReviewActions
                    job={job}
                    onApprove={handleApprove}
                    onNegotiate={handleNegotiate}
                    onDeny={handleDeny}
                  />
                </View>
              );
            })}
          </View>
        )}

        {/* Categories */}
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesScroll}
        >
          {[
            "All",
            "Plumber",
            "Electrician",
            "Cleaner",
            "Carpenter",
            "AC Technician",
            "Painter",
          ].map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryCard,
                activeCategory === cat && styles.activeCategory,
              ]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text
                style={[
                  styles.categoryText,
                  activeCategory === cat && styles.activeCategoryText,
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Workers List */}
        <Text style={styles.sectionTitle}>Top Professionals</Text>
        <View style={styles.workerList}>
          {!!fetchError ? (
            <Text style={styles.emptyText}>
              Failed to load workers: {fetchError}
            </Text>
          ) : null}
          {!loading && filteredWorkers.length === 0 ? (
            <Text style={styles.emptyText}>
              No approved workers available right now.
            </Text>
          ) : null}
          {filteredWorkers.map((worker) => (
            <TouchableOpacity
              key={worker.id || (worker as any)._id}
              style={styles.workerCard}
              onPress={() =>
                router.push({
                  pathname: "/(customer)/worker-detail/[id]",
                  params: { id: worker.id || (worker as any)._id },
                })
              }
            >
              <Image
                source={{ uri: worker.image }}
                style={styles.workerImage}
              />
              <View style={styles.workerInfo}>
                <Text style={styles.workerName}>{worker.name}</Text>
                <Text style={styles.workerCategory}>{worker.category}</Text>
                <View style={styles.ratingRow}>
                  <Ionicons name="star" size={16} color={Colors.accent} />
                  <Text style={styles.ratingText}>{worker.rating}</Text>
                  <Text style={styles.rateText}>
                    • {worker.hourlyRate} LKR/hr
                  </Text>
                </View>
              </View>
              <Ionicons
                name="chevron-forward"
                size={24}
                color={Colors.border}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 24, paddingBottom: 100 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  backButton: { marginRight: 16 },
  heading: { fontSize: 24, fontFamily: "Inter_700Bold", color: Colors.primary },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, fontSize: 16, fontFamily: "Inter_400Regular" },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
    color: Colors.text,
  },
  categoriesScroll: { marginBottom: 24, flexDirection: "row" },
  categoryCard: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  activeCategory: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryText: {
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  activeCategoryText: { color: Colors.white },
  workerList: { gap: 16 },
  workerCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
    borderWidth: 1,
    borderColor: Colors.background,
  },
  workerImage: { width: 60, height: 60, borderRadius: 30, marginRight: 16 },
  workerInfo: { flex: 1 },
  workerName: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.text,
  },
  workerCategory: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  ratingRow: { flexDirection: "row", alignItems: "center" },
  ratingText: {
    marginLeft: 4,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    fontSize: 14,
  },
  rateText: { marginLeft: 8, color: Colors.textSecondary, fontSize: 14 },
  emptyText: {
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
  },
  toReviewSection: { marginBottom: 24 },
  reviewCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.accent,
    borderLeftWidth: 4,
    borderLeftColor: Colors.accent,
  },
  reviewCardHeader: { flexDirection: "row", alignItems: "flex-start" },
  reviewWorker: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
  },
  reviewService: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  reviewDesc: {
    fontSize: 12,
    color: Colors.text,
    marginTop: 6,
    lineHeight: 16,
  },
  reviewPriceBox: {
    backgroundColor: Colors.lightBackground,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignItems: "center",
    marginLeft: 10,
  },
  reviewPriceLabel: { fontSize: 10, color: Colors.textSecondary },
  reviewPriceValue: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
});
