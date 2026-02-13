import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";

export default function WorkerSelectionPage() {
  const router = useRouter();
  const { workers } = useStore();
  const params = useLocalSearchParams();
  const [sortBy, setSortBy] = useState<"nearest" | "rating" | "price">(
    "nearest",
  );

  const sortedWorkers = [...workers].sort((a, b) => {
    if (sortBy === "rating") return b.rating - a.rating;
    if (sortBy === "price") return a.hourlyRate - b.hourlyRate;
    return 0;
  });

  const renderWorkerCard = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.workerCard}
      onPress={() =>
        router.push({
          pathname: "/booking-confirmation",
          params: {
            workerId: item.id,
            ...params,
          },
        })
      }
    >
      <View style={styles.workerHeader}>
        <Image source={{ uri: item.image }} style={styles.workerImage} />
        <View style={{ flex: 1 }}>
          <Text style={styles.workerName}>{item.name}</Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color="#FFB800" />
            <Text style={styles.ratingText}>
              {item.rating} ({item.reviews || 0} reviews)
            </Text>
          </View>
          <Text style={styles.workerCategory}>
            {item.category} • {item.about?.split(" ").slice(0, 3).join(" ")}...
          </Text>
        </View>
      </View>

      <View style={styles.detailsGrid}>
        <View style={styles.detailItem}>
          <Ionicons name="location-outline" size={16} color={Colors.primary} />
          <Text style={styles.detailText}>{item.location}</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="time-outline" size={16} color={Colors.primary} />
          <Text style={styles.detailText}>10 min away</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="wallet-outline" size={16} color={Colors.primary} />
          <Text style={styles.detailText}>{item.hourlyRate} LKR/hr</Text>
        </View>
      </View>

      <View style={styles.availabilityBadge}>
        <View style={styles.availabilityDot} />
        <Text style={styles.availabilityText}>Available now</Text>
      </View>

      <TouchableOpacity
        style={styles.bookButton}
        onPress={() =>
          router.push({
            pathname: "/booking-confirmation",
            params: {
              workerId: item.id,
              ...params,
            },
          })
        }
      >
        <Text style={styles.bookButtonText}>Select & Proceed</Text>
        <Ionicons name="arrow-forward" size={18} color={Colors.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.heading}>Select Worker</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === "nearest" && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy("nearest")}
        >
          <Ionicons
            name="location-outline"
            size={16}
            color={sortBy === "nearest" ? "white" : Colors.primary}
          />
          <Text
            style={[
              styles.sortText,
              sortBy === "nearest" && styles.sortTextActive,
            ]}
          >
            Nearest
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === "rating" && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy("rating")}
        >
          <Ionicons
            name="star-outline"
            size={16}
            color={sortBy === "rating" ? "white" : Colors.primary}
          />
          <Text
            style={[
              styles.sortText,
              sortBy === "rating" && styles.sortTextActive,
            ]}
          >
            Best Rated
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.sortButton,
            sortBy === "price" && styles.sortButtonActive,
          ]}
          onPress={() => setSortBy("price")}
        >
          <Ionicons
            name="wallet-outline"
            size={16}
            color={sortBy === "price" ? "white" : Colors.primary}
          />
          <Text
            style={[
              styles.sortText,
              sortBy === "price" && styles.sortTextActive,
            ]}
          >
            Low Price
          </Text>
        </TouchableOpacity>
      </View>

      {/* Workers List */}
      <FlatList
        data={sortedWorkers}
        renderItem={renderWorkerCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        scrollEnabled={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
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
  sortContainer: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sortButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.lightBackground,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sortButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },
  sortTextActive: {
    color: "white",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  workerCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workerHeader: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
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
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  workerCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  detailsGrid: {
    backgroundColor: Colors.lightBackground,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  detailText: {
    fontSize: 12,
    color: Colors.text,
  },
  availabilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  availabilityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  availabilityText: {
    fontSize: 12,
    color: "#4CAF50",
    fontWeight: "600",
  },
  bookButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  bookButtonText: {
    color: Colors.primary,
    fontWeight: "600",
    fontSize: 13,
  },
});
