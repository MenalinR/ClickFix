import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { io } from "socket.io-client";
import LiveTrackingMap, { LatLng } from "../../components/LiveTrackingMap";
import { api, apiCall } from "../../constants/api";
import { Colors } from "../../constants/Colors";
import { config } from "../../constants/config";
import { useStore } from "../../constants/Store";
import { useLocationBroadcast } from "../../hooks/useLocationBroadcast";
import { useRoadRoute } from "../../hooks/useRoadRoute";
import { openGoogleMapsDirections } from "../../utils/openInMaps";

const socketBaseURL = () => {
  const base = config.api.baseURL || "";
  return base.replace(/\/api\/?$/, "");
};

export default function PickupRouteScreen() {
  const router = useRouter();
  const { token } = useStore();
  const params = useLocalSearchParams();

  const jobId = (Array.isArray(params.jobId) ? params.jobId[0] : params.jobId) as
    | string
    | undefined;
  const shopName = (params.shopName as string) || "Hardware shop";
  const requestId = (Array.isArray(params.requestId)
    ? params.requestId[0]
    : params.requestId) as string | undefined;
  const shopLat = params.shopLat ? Number(params.shopLat) : NaN;
  const shopLng = params.shopLng ? Number(params.shopLng) : NaN;
  const destination: LatLng | null =
    Number.isFinite(shopLat) && Number.isFinite(shopLng)
      ? { latitude: shopLat, longitude: shopLng }
      : null;

  const [myCoords, setMyCoords] = useState<LatLng | null>(null);
  const [pickingUp, setPickingUp] = useState(false);
  const [arrived, setArrived] = useState(false);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  // Let the shop's tracking screen know the moment the worker confirms
  // they've reached the shop — a short-lived socket just for this one event.
  const handleArrived = () => {
    setArrived(true);
    if (!jobId) return;
    const socket = io(socketBaseURL(), { transports: ["websocket"] });
    socket.on("connect", () => {
      socket.emit("worker-arrived", { jobId });
      setTimeout(() => socket.disconnect(), 300);
    });
  };

  // Worker confirms they've collected the items. Moves the order to
  // "picked_up" and notifies the customer, then returns to the order list
  // where the "On my way to customer" action appears.
  const handlePickedUp = async () => {
    if (!token || !requestId) {
      Alert.alert(
        "Can't confirm here",
        "Open this pickup from the Hardware order list so it can be marked picked up.",
      );
      return;
    }
    try {
      setPickingUp(true);
      const res = await apiCall(
        api.hardware.confirmPickup(requestId),
        "PUT",
        undefined,
        token,
      );
      if (!res?.success) {
        Alert.alert("Error", res?.message || "Couldn't mark as picked up");
        return;
      }

      // Start the trip to the customer straight away: flip the job to
      // "On the way" (so the customer sees "coming to your location") and open
      // the route-to-customer map.
      if (jobId) {
        try {
          await apiCall(
            api.jobs.updateStatus(jobId),
            "PUT",
            { status: "On the way" },
            token,
          );
        } catch {
          // non-fatal — the worker can still start it from the order list
        }
        router.replace({
          pathname: "/job-route",
          params: { jobId, from: "hardware-updates" },
        });
      } else {
        router.replace("/(worker)/hardware-updates");
      }
    } catch (e: any) {
      Alert.alert("Error", e?.message || "Couldn't mark as picked up");
    } finally {
      setPickingUp(false);
    }
  };

  // Real road route from us to the shop.
  const { routeCoords, distanceText, durationText } = useRoadRoute(
    myCoords,
    destination,
    token,
  );

  // Keep streaming our position to the shop/customer while this screen is open.
  useLocationBroadcast({
    jobId: jobId || null,
    phase: "coming",
    active: !!jobId,
    token,
  });

  // Watch our own position so we can draw ourselves on the map.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const fg = await Location.requestForegroundPermissionsAsync();
      if (!fg.granted || cancelled) return;
      // Get a fresh GPS fix first — watchPositionAsync's first callback often
      // returns a stale cached position which shows the wrong location on map.
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
        // ignore — watchPositionAsync will still deliver updates
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

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.replace("/(worker)/hardware-updates")}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>
          {arrived ? "At the shop" : "On the way to shop"}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <LiveTrackingMap
          workerCoords={myCoords}
          destination={destination}
          routeCoords={routeCoords}
          workerLabel="You"
          destinationLabel={shopName}
          bannerText={
            arrived
              ? `You've arrived at ${shopName}`
              : durationText
                ? `${durationText} away${distanceText ? ` · ${distanceText}` : ""}`
                : `Heading to ${shopName}`
          }
          emptyText="Getting your location…"
          height={360}
        />

        {!arrived ? (
          <TouchableOpacity style={styles.pickedUpBtn} onPress={handleArrived}>
            <Ionicons name="checkmark-circle-outline" size={20} color="white" />
            <Text style={styles.pickedUpBtnText}>Yes, I&apos;ve arrived</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.pickedUpBtn, pickingUp && { opacity: 0.6 }]}
            onPress={handlePickedUp}
            disabled={pickingUp}
          >
            {pickingUp ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="bag-check-outline" size={20} color="white" />
                <Text style={styles.pickedUpBtnText}>
                  I&apos;ve picked up the items
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.mapsBtn, !destination && { opacity: 0.5 }]}
          onPress={() => destination && openGoogleMapsDirections(destination)}
          disabled={!destination}
        >
          <Ionicons name="map-outline" size={18} color={Colors.primary} />
          <Text style={styles.mapsBtnText}>Open in Google Maps</Text>
        </TouchableOpacity>

        {!destination && (
          <View style={styles.warnCard}>
            <Ionicons name="warning" size={18} color="#B26A00" />
            <Text style={styles.warnText}>
              {shopName} hasn&apos;t set their map location yet. Ask them to tap
              &quot;Use my current location&quot; in their Profile so a route can
              be drawn here.
            </Text>
          </View>
        )}

        <View style={styles.infoCard}>
          <Ionicons name="navigate" size={18} color={Colors.primary} />
          <Text style={styles.infoText}>
            {arrived
              ? "Once you've collected the items, confirm pickup to start the trip to the customer."
              : destination
                ? `Follow the route to ${shopName}. The shop can see your live location while you're on the way.`
                : `Your live location is still being shared with ${shopName} even without a route.`}
          </Text>
        </View>
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
  warnCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    backgroundColor: "#FFF3E0",
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: "#FFCC80",
  },
  warnText: { flex: 1, fontSize: 13, color: "#8A5A00", lineHeight: 18 },
  mapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.lightBackground,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
  },
  mapsBtnText: { color: Colors.primary, fontSize: 14, fontWeight: "700" },
  pickedUpBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    paddingVertical: 14,
  },
  pickedUpBtnText: { color: "white", fontSize: 16, fontWeight: "700" },
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
});
