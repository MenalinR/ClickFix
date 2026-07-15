import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LiveTrackingMap, { LatLng } from "../../components/LiveTrackingMap";
import { api, apiCall } from "../../constants/api";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";
import { useLocationBroadcast } from "../../hooks/useLocationBroadcast";
import { useRoadRoute } from "../../hooks/useRoadRoute";

export default function JobRouteScreen() {
  const router = useRouter();
  const { token } = useStore();
  const params = useLocalSearchParams();

  const jobId = (Array.isArray(params.jobId) ? params.jobId[0] : params.jobId) as
    | string
    | undefined;
  const customerName = (params.customerName as string) || "the customer";

  const [destination, setDestination] = useState<LatLng | null>(null);
  const [myCoords, setMyCoords] = useState<LatLng | null>(null);
  const [arriving, setArriving] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  // Stream our position to the customer while heading to the job site.
  useLocationBroadcast({
    jobId: jobId || null,
    phase: "On the way",
    active: !!jobId,
    token,
  });

  // Road route to the customer.
  const { routeCoords, distanceText, durationText } = useRoadRoute(
    myCoords,
    destination,
    token,
  );

  // Fetch the customer's location (job destination) once.
  useEffect(() => {
    if (!jobId || !token) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiCall(
          api.jobs.liveLocation(jobId),
          "GET",
          undefined,
          token,
        );
        if (cancelled || !res?.success) return;
        const coords = res.data?.destination?.coordinates; // [lng, lat]
        if (coords?.length === 2) {
          setDestination({ longitude: coords[0], latitude: coords[1] });
        }
      } catch {
        // silent
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [jobId, token]);

  // Watch our own position to draw ourselves on the map.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fg = await Location.requestForegroundPermissionsAsync();
      if (!fg.granted || cancelled) return;
      // Fresh fix first — watchPositionAsync's first callback is often stale cache.
      try {
        const fresh = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        if (!cancelled) {
          setMyCoords({
            latitude: fresh.coords.latitude,
            longitude: fresh.coords.longitude,
          });
        }
      } catch {
        // ignore — watchPositionAsync will deliver updates
      }
      if (cancelled) return;
      watchRef.current = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.High, timeInterval: 4000, distanceInterval: 10 },
        (loc) => {
          if (!cancelled) {
            setMyCoords({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          }
        },
      );
    })();
    return () => {
      cancelled = true;
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, []);

  const handleArrived = async () => {
    if (!jobId || !token) return;
    try {
      setArriving(true);
      const res = await apiCall(
        api.jobs.updateStatus(jobId),
        "PUT",
        { status: "In progress" },
        token,
      );
      if (!res?.success) {
        Alert.alert("Error", res?.message || "Could not update job status");
        return;
      }
      // Go back to job details where the worker manages the active job.
      router.back();
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Could not update job status");
    } finally {
      setArriving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>On the way to customer</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <LiveTrackingMap
          workerCoords={myCoords}
          destination={destination}
          routeCoords={routeCoords}
          workerLabel="You"
          destinationLabel="Customer"
          bannerText={
            durationText
              ? `${durationText} away${distanceText ? ` · ${distanceText}` : ""}`
              : "Heading to the job"
          }
          emptyText="Getting your location…"
          height={320}
        />

        <View style={styles.infoCard}>
          <Ionicons name="navigate" size={18} color={Colors.primary} />
          <Text style={styles.infoText}>
            {destination
              ? `Follow the route to ${customerName}'s location. They can see your live location on the way.`
              : `Couldn't load the job location, but your live location is still shared with ${customerName}.`}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.arrivedBtn}
          onPress={handleArrived}
          disabled={arriving}
        >
          {arriving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.arrivedBtnText}>I've Arrived — Start Job</Text>
            </>
          )}
        </TouchableOpacity>
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
  infoText: { flex: 1, fontSize: 13, color: "#1565C0", lineHeight: 18 },
  arrivedBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 14,
  },
  arrivedBtnText: { color: "white", fontSize: 16, fontWeight: "700" },
});
