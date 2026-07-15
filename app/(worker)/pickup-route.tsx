import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import LiveTrackingMap, { LatLng } from "../../components/LiveTrackingMap";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";
import { useLocationBroadcast } from "../../hooks/useLocationBroadcast";
import { useRoadRoute } from "../../hooks/useRoadRoute";

export default function PickupRouteScreen() {
  const router = useRouter();
  const { token } = useStore();
  const params = useLocalSearchParams();

  const jobId = (Array.isArray(params.jobId) ? params.jobId[0] : params.jobId) as
    | string
    | undefined;
  const shopName = (params.shopName as string) || "Hardware shop";
  const shopLat = params.shopLat ? Number(params.shopLat) : NaN;
  const shopLng = params.shopLng ? Number(params.shopLng) : NaN;
  const destination: LatLng | null =
    Number.isFinite(shopLat) && Number.isFinite(shopLng)
      ? { latitude: shopLat, longitude: shopLng }
      : null;

  const [myCoords, setMyCoords] = useState<LatLng | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

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
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>On the way to shop</Text>
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
            durationText
              ? `${durationText} away${distanceText ? ` · ${distanceText}` : ""}`
              : `Heading to ${shopName}`
          }
          emptyText="Getting your location…"
          height={360}
        />

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
            {destination
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
