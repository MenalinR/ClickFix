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
  const { jobs, fetchJobs, token, customerRespondToJob, user, logout } = useStore();
  const handleGoLanding = () => {
    router.dismissAll();
    router.replace("/");
    logout();
  };
  const customerName = (user as any)?.name || "there";
  const firstName = String(customerName).split(" ")[0];
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
          <Text style={styles.heading}>Find Services</Text>
          <TouchableOpacity
            onPress={handleGoLanding}
            style={styles.homeIconBtn}
          >
            <Ionicons name="home" size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.welcomeBlock}>
          <Text style={styles.welcomeGreeting}>Welcome back,</Text>
          <Text style={styles.welcomeName}>{firstName} 👋</Text>
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  homeIconBtn: {
    padding: 4,
  },
  welcomeBlock: { marginBottom: 20 },
  welcomeGreeting: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  welcomeName: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.text,
    marginTop: 2,
  },
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
