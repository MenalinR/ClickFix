import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { io, Socket } from "socket.io-client";
import LiveTrackingMap, { LatLng } from "../../components/LiveTrackingMap";
import { api, apiCall } from "../../constants/api";
import { Colors } from "../../constants/Colors";
import { config } from "../../constants/config";
import { useStore } from "../../constants/Store";
import { useRoadRoute } from "../../hooks/useRoadRoute";

const socketBaseURL = () => {
  const base = config.api.baseURL || "";
  return base.replace(/\/api\/?$/, "");
};

export default function TrackWorkerScreen() {
  const router = useRouter();
  const { user, token } = useStore();
  const shop = user as any;
  const params = useLocalSearchParams();

  const jobId = (Array.isArray(params.jobId) ? params.jobId[0] : params.jobId) as
    | string
    | undefined;
  const workerName = (params.workerName as string) || "Worker";

  // The shop's own location is the reference point on the map.
  const shopCoords: LatLng | null =
    shop?.location?.coordinates?.length === 2
      ? {
          longitude: shop.location.coordinates[0],
          latitude: shop.location.coordinates[1],
        }
      : null;

  const [workerCoords, setWorkerCoords] = useState<LatLng | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Real road route from the worker's live position to the shop.
  const { routeCoords, distanceText, durationText } = useRoadRoute(
    workerCoords,
    shopCoords,
    token,
  );

  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;

    // Fetch the last saved position immediately so the map isn't blank if the
    // worker hasn't moved since the shop opened this screen.
    (async () => {
      try {
        const res = await apiCall(api.jobs.liveLocation(jobId), "GET", undefined, token);
        if (cancelled || !res?.success) return;
        const w = res.data?.worker;
        if (w?.coordinates?.length === 2) {
          setWorkerCoords({
            longitude: w.coordinates[0],
            latitude: w.coordinates[1],
          });
        }
      } catch {
        // silent — socket stream will fill in when worker moves
      }
    })();

    const socket = io(socketBaseURL(), { transports: ["websocket"] });
    socketRef.current = socket;
    socket.emit("join-job-tracking", jobId);
    socket.on("worker-location", (payload: any) => {
      if (!payload?.coords) return;
      setWorkerCoords({
        latitude: payload.coords.latitude,
        longitude: payload.coords.longitude,
      });
    });
    return () => {
      cancelled = true;
      socket.emit("leave-job-tracking", jobId);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [jobId, token]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Track {workerName}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <LiveTrackingMap
          workerCoords={workerCoords}
          destination={shopCoords}
          routeCoords={routeCoords}
          workerLabel={workerName}
          destinationLabel="Your shop"
          bannerText={
            durationText
              ? `${workerName} · ${durationText} away${
                  distanceText ? ` · ${distanceText}` : ""
                }`
              : workerCoords
                ? `${workerName} is on the way`
                : undefined
          }
          emptyText={`Waiting for ${workerName} to share their location…`}
          height={360}
        />

        <View style={styles.infoCard}>
          <Ionicons name="walk" size={18} color={Colors.primary} />
          <Text style={styles.infoText}>
            {workerCoords
              ? "The worker is on the way to pick up the order. Their marker updates live."
              : "Live location will appear as soon as the worker starts moving toward your shop."}
          </Text>
        </View>

        {!shopCoords && (
          <View style={[styles.infoCard, styles.warnCard]}>
            <Ionicons name="alert-circle" size={18} color="#B26A00" />
            <Text style={[styles.infoText, { color: "#8A5A00" }]}>
              Set your shop location in Profile so the map can show the worker&apos;s
              distance to your shop.
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  back: { padding: 4 },
  title: { fontSize: 18, fontWeight: "700", color: Colors.text },
  body: { padding: 16, gap: 14 },
  infoCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: "#E3F2FD",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#90CAF9",
  },
  warnCard: { backgroundColor: "#FFF3E0", borderColor: "#FFCC80" },
  infoText: { flex: 1, fontSize: 13, color: "#1565C0", lineHeight: 18 },
});
