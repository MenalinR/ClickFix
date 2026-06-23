import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
    Image,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { io, Socket } from "socket.io-client";
import { api, apiCall } from "../../constants/api";
import { Colors } from "../../constants/Colors";
import { config } from "../../constants/config";
import { useStore } from "../../constants/Store";

type JobStatus =
  | "Waiting"
  | "Accepted"
  | "On the way"
  | "In progress"
  | "Completed";

interface LatLng {
  latitude: number;
  longitude: number;
}

const socketBaseURL = () => {
  const base = config.api.baseURL || "";
  return base.replace(/\/api\/?$/, "");
};

// What leg of the trip the worker is on (sent with each location ping).
const PHASE_LABEL: Record<string, string> = {
  coming: "Heading to the hardware shop",
  "On the way": "On the way to your location",
  "In progress": "Working at your location",
};

// Map the backend's full status enum onto the 5 timeline stages.
const normalizeStatus = (status?: string): JobStatus => {
  if (status === "On the way") return "On the way";
  if (status === "In progress") return "In progress";
  if (status === "Completed") return "Completed";
  if (status === "Accepted") return "Accepted";
  return "Waiting";
};

export default function JobTrackingPage() {
  const router = useRouter();
  const { jobId, workerId } = useLocalSearchParams();
  const { workers, token } = useStore();
  const worker = workers.find((w) => w.id === workerId);
  const [jobStatus, setJobStatus] = useState<JobStatus>("Accepted");
  const [showHardwareModal, setShowHardwareModal] = useState(false);

  const [workerCoords, setWorkerCoords] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [trackingPhase, setTrackingPhase] = useState<string>("");
  const mapRef = useRef<MapView | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const id = Array.isArray(jobId) ? jobId[0] : jobId;

  // Fetch the last known position once, then subscribe to the live stream.
  useEffect(() => {
    if (!id || !token) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await apiCall(
          api.jobs.liveLocation(id),
          "GET",
          undefined,
          token,
        );
        if (cancelled || !res?.success) return;
        const d = res.data;
        if (d?.destination?.coordinates?.length === 2) {
          setDestination({
            longitude: d.destination.coordinates[0],
            latitude: d.destination.coordinates[1],
          });
        }
        if (d?.worker?.coordinates?.length === 2) {
          setWorkerCoords({
            longitude: d.worker.coordinates[0],
            latitude: d.worker.coordinates[1],
          });
          if (d.worker.phase) setTrackingPhase(d.worker.phase);
        }
        if (d?.status) setJobStatus(normalizeStatus(d.status));
      } catch {
        // silent — the socket stream will fill in shortly
      }
    })();

    const socket = io(socketBaseURL(), { transports: ["websocket"] });
    socketRef.current = socket;
    socket.emit("join-job-tracking", id);
    socket.on("worker-location", (payload: any) => {
      if (!payload?.coords) return;
      setWorkerCoords({
        latitude: payload.coords.latitude,
        longitude: payload.coords.longitude,
      });
      if (payload.phase) setTrackingPhase(payload.phase);
    });

    return () => {
      cancelled = true;
      socket.emit("leave-job-tracking", id);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [id, token]);

  // Keep the map framed on the worker, plus the destination when we know it.
  useEffect(() => {
    if (!workerCoords || !mapRef.current) return;
    if (destination) {
      mapRef.current.fitToCoordinates([workerCoords, destination], {
        edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
        animated: true,
      });
    } else {
      mapRef.current.animateToRegion(
        { ...workerCoords, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        500,
      );
    }
  }, [workerCoords, destination]);

  const statusStages: JobStatus[] = [
    "Waiting",
    "Accepted",
    "On the way",
    "In progress",
    "Completed",
  ];
  const currentStatusIndex = statusStages.indexOf(jobStatus);

  const suggestedHardware = [
    { id: "1", name: "PVC Pipe (1 inch)", price: 450, status: "suggested" },
    { id: "2", name: "Pipe Fitting", price: 200, status: "approved" },
  ];

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
          <Text style={styles.heading}>Job Status</Text>
          <TouchableOpacity style={styles.callButton}>
            <Ionicons name="call-outline" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Live Map */}
        {id && (workerCoords || destination) ? (
          <View style={styles.mapWrap}>
            <MapView
              ref={mapRef}
              provider={PROVIDER_GOOGLE}
              style={styles.map}
              initialRegion={{
                latitude: (workerCoords || destination)!.latitude,
                longitude: (workerCoords || destination)!.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
            >
              {destination && (
                <Marker
                  coordinate={destination}
                  title="Your location"
                  pinColor={Colors.accent}
                />
              )}
              {workerCoords && (
                <Marker
                  coordinate={workerCoords}
                  title={worker?.name || "Worker"}
                  description={PHASE_LABEL[trackingPhase] || "On the move"}
                >
                  <View style={styles.workerMarker}>
                    <Ionicons name="navigate" size={16} color="white" />
                  </View>
                </Marker>
              )}
            </MapView>
            {!!trackingPhase && (
              <View style={styles.mapBanner}>
                <View style={styles.liveDot} />
                <Text style={styles.mapBannerText}>
                  {PHASE_LABEL[trackingPhase] || "Live location"}
                </Text>
              </View>
            )}
          </View>
        ) : id ? (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={28} color={Colors.textSecondary} />
            <Text style={styles.mapPlaceholderText}>
              The worker&apos;s live location will appear here once they head out.
            </Text>
          </View>
        ) : null}

        {/* Worker Card */}
        {worker && (
          <View style={styles.workerCard}>
            <View style={styles.workerInfo}>
              <Image
                source={{ uri: worker.image }}
                style={styles.workerImage}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.workerName}>{worker.name}</Text>
                <View style={styles.availabilityBadge}>
                  <View style={styles.dot} />
                  <Text style={styles.availabilityText}>
                    Currently on the way
                  </Text>
                </View>
                <Text style={styles.eta}>ETA: 8 mins away</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.navigateButton}>
              <Ionicons
                name="navigate-outline"
                size={20}
                color={Colors.primary}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Job Status Timeline */}
        <Text style={styles.sectionTitle}>Job Progress</Text>
        <View style={styles.timeline}>
          {statusStages.map((status, idx) => (
            <View key={status} style={{ flex: 1, alignItems: "center" }}>
              <View
                style={[
                  styles.statusCircle,
                  idx <= currentStatusIndex && styles.statusCircleActive,
                ]}
              >
                <Text
                  style={[
                    styles.statusIcon,
                    idx <= currentStatusIndex && styles.statusIconActive,
                  ]}
                >
                  {idx === 0
                    ? "🔔"
                    : idx === 1
                      ? "✓"
                      : idx === 2
                        ? "🚗"
                        : idx === 3
                          ? "🔧"
                          : "✅"}
                </Text>
              </View>
              <Text
                style={[
                  styles.statusLabel,
                  idx <= currentStatusIndex && styles.statusLabelActive,
                ]}
              >
                {status}
              </Text>
              {idx < statusStages.length - 1 && (
                <View
                  style={[
                    styles.progressLine,
                    idx < currentStatusIndex && styles.progressLineActive,
                  ]}
                />
              )}
            </View>
          ))}
        </View>

        {/* Current Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusCardTitle}>Current Status</Text>
            <View
              style={[
                styles.statusBadge,
                jobStatus === "Accepted" && { backgroundColor: "#E3F2FD" },
                jobStatus === "On the way" && { backgroundColor: "#FFF3E0" },
                jobStatus === "In progress" && { backgroundColor: "#E8F5E9" },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  jobStatus === "Accepted" && { color: "#1976D2" },
                  jobStatus === "On the way" && { color: "#FF9800" },
                  jobStatus === "In progress" && { color: "#4CAF50" },
                ]}
              >
                {jobStatus === "Accepted" && "✓ Accepted"}
                {jobStatus === "On the way" && "🚗 On the way"}
                {jobStatus === "In progress" && "🔧 In Progress"}
              </Text>
            </View>
          </View>
          <Text style={styles.statusDescription}>
            {jobStatus === "Accepted"
              ? "Professional has accepted your booking and is preparing to start."
              : jobStatus === "On the way"
                ? "Professional is on the way to your location."
                : jobStatus === "In progress"
                  ? "Professional has arrived and started working on your issue."
                  : "Job completed! Please review and rate."}
          </Text>
        </View>

        {/* Hardware Suggestions */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.sectionTitle}>Hardware Needed</Text>
            <TouchableOpacity onPress={() => setShowHardwareModal(true)}>
              <Text style={styles.viewAllLink}>View Details</Text>
            </TouchableOpacity>
          </View>
          {suggestedHardware.slice(0, 2).map((item) => (
            <View key={item.id} style={styles.hardwareItem}>
              <View>
                <Text style={styles.hardwareName}>{item.name}</Text>
                <Text style={styles.hardwarePrice}>{item.price} LKR</Text>
              </View>
              <View
                style={[
                  styles.approvalBadge,
                  item.status === "approved" && styles.approvalBadgeApproved,
                ]}
              >
                <Text
                  style={[
                    styles.approvalText,
                    item.status === "approved" && styles.approvalTextApproved,
                  ]}
                >
                  {item.status === "approved" ? "✓ Approved" : "⏳ Pending"}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Chat Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Chat</Text>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={() => router.push("./chat")}
          >
            <Ionicons
              name="chatbubble-outline"
              size={20}
              color={Colors.primary}
            />
            <Text style={styles.chatButtonText}>
              Send message to professional
            </Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Additional Info */}
        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={Colors.primary}
          />
          <Text style={styles.infoText}>
            Professional's location is updated in real-time. You'll receive
            notifications for major status updates.
          </Text>
        </View>
      </ScrollView>

      {/* Hardware Modal */}
      <Modal visible={showHardwareModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hardware Items</Text>
              <TouchableOpacity onPress={() => setShowHardwareModal(false)}>
                <Ionicons name="close-outline" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              {suggestedHardware.map((item) => (
                <View key={item.id} style={styles.hardwareModalItem}>
                  <View>
                    <Text style={styles.hardwareName}>{item.name}</Text>
                    <Text style={styles.hardwarePrice}>{item.price} LKR</Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.approveButton,
                      item.status === "approved" &&
                        styles.approveButtonApproved,
                    ]}
                  >
                    <Text
                      style={[
                        styles.approveButtonText,
                        item.status === "approved" &&
                          styles.approveButtonTextApproved,
                      ]}
                    >
                      {item.status === "approved" ? "✓ Approved" : "Approve"}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowHardwareModal(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
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
  callButton: {
    padding: 8,
    borderRadius: 8,
  },
  mapWrap: {
    height: 240,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  workerMarker: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  mapBanner: {
    position: "absolute",
    top: 10,
    left: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#4CAF50",
  },
  mapBannerText: {
    color: "white",
    fontSize: 12,
    fontWeight: "600",
  },
  mapPlaceholder: {
    height: 140,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.lightBackground,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  mapPlaceholderText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  heading: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.text,
  },
  workerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  workerImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  workerName: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 4,
  },
  availabilityBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FF9800",
  },
  availabilityText: {
    fontSize: 11,
    color: "#FF9800",
    fontWeight: "600",
  },
  eta: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  navigateButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.lightBackground,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: Colors.text,
    marginBottom: 12,
  },
  timeline: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    height: 100,
  },
  statusCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "white",
  },
  statusCircleActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.lightBackground,
  },
  statusIcon: {
    fontSize: 18,
    color: Colors.textSecondary,
  },
  statusIconActive: {
    color: Colors.primary,
  },
  statusLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    marginTop: 8,
    textAlign: "center",
  },
  statusLabelActive: {
    color: Colors.primary,
    fontWeight: "600",
  },
  progressLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginTop: 4,
  },
  progressLineActive: {
    backgroundColor: Colors.primary,
  },
  statusCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  statusCardTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  statusDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  viewAllLink: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },
  hardwareItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  hardwareName: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text,
    marginBottom: 4,
  },
  hardwarePrice: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },
  approvalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "#FFF3E0",
  },
  approvalBadgeApproved: {
    backgroundColor: "#E8F5E9",
  },
  approvalText: {
    fontSize: 11,
    color: "#FF9800",
    fontWeight: "600",
  },
  approvalTextApproved: {
    color: "#4CAF50",
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.lightBackground,
  },
  chatButtonText: {
    flex: 1,
    fontSize: 13,
    color: Colors.text,
    fontWeight: "500",
  },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    backgroundColor: "#E3F2FD",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#90CAF9",
    marginBottom: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: "#1565C0",
    lineHeight: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.text,
  },
  modalBody: {
    paddingHorizontal: 16,
  },
  hardwareModalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  approveButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  approveButtonApproved: {
    backgroundColor: "#E8F5E9",
    borderColor: "#4CAF50",
  },
  approveButtonText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: "600",
  },
  approveButtonTextApproved: {
    color: "#4CAF50",
  },
  modalFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  closeButton: {
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  closeButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text,
  },
});
