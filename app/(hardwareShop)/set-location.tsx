import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { SafeAreaView } from "react-native-safe-area-context";
import { api, apiCall } from "../../constants/api";
import { Colors } from "../../constants/Colors";
import { useStore } from "../../constants/Store";

interface LatLng {
  latitude: number;
  longitude: number;
}

// Default to Colombo when the shop has no saved location and GPS is unavailable.
const DEFAULT_REGION = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function SetShopLocationScreen() {
  const router = useRouter();
  const { user, token, setUser } = useStore();
  const shop = user as any;

  // Start the pin on the shop's already-saved location if there is one.
  const savedCoords: LatLng | null =
    shop?.location?.coordinates?.length === 2
      ? {
          longitude: shop.location.coordinates[0],
          latitude: shop.location.coordinates[1],
        }
      : null;

  const [pin, setPin] = useState<LatLng | null>(savedCoords);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef<MapView | null>(null);

  const moveTo = (coords: LatLng) => {
    setPin(coords);
    mapRef.current?.animateToRegion(
      { ...coords, latitudeDelta: 0.01, longitudeDelta: 0.01 },
      400,
    );
  };

  // Convenience only: recenter the map/pin on the device's current position.
  // This does NOT save — the shop still has to press Save.
  const useCurrentLocation = async () => {
    try {
      setLocating(true);
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) {
        Alert.alert(
          "Permission needed",
          "Allow location access to center the map on where you are now.",
        );
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      moveTo({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Could not get your location");
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    if (!token) return;
    if (!pin) {
      Alert.alert(
        "Drop a pin first",
        "Tap on the map (or drag the pin) to mark your shop's exact location.",
      );
      return;
    }
    try {
      setSaving(true);
      const res = await apiCall(
        api.hardwareShop.setLocation,
        "PUT",
        { latitude: pin.latitude, longitude: pin.longitude },
        token,
      );
      if (!res?.success) throw new Error(res?.message || "Could not save location");
      setUser({ ...(user as any), location: res.data?.location });
      Alert.alert("Saved", "Your shop location is set. Workers will be routed here.");
      router.back();
    } catch (e: any) {
      Alert.alert("Failed", e?.message || "Could not save location");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Ionicons name="arrow-back" size={24} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.title}>Set shop location</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          initialRegion={
            pin
              ? { ...pin, latitudeDelta: 0.01, longitudeDelta: 0.01 }
              : DEFAULT_REGION
          }
          onPress={(e) => setPin(e.nativeEvent.coordinate)}
        >
          {pin && (
            <Marker
              coordinate={pin}
              draggable
              onDragEnd={(e) => setPin(e.nativeEvent.coordinate)}
              pinColor={Colors.accent}
              title="Your shop"
            />
          )}
        </MapView>

        <TouchableOpacity
          style={styles.locateBtn}
          onPress={useCurrentLocation}
          disabled={locating}
        >
          {locating ? (
            <ActivityIndicator color={Colors.primary} size="small" />
          ) : (
            <Ionicons name="locate" size={22} color={Colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <View style={styles.hintRow}>
          <Ionicons name="information-circle" size={18} color={Colors.primary} />
          <Text style={styles.hint}>
            Tap the map or drag the pin to your shop&apos;s exact spot, then Save.
            This fixed location is what workers navigate to — it doesn&apos;t
            change with where your phone is.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, (!pin || saving) && { opacity: 0.5 }]}
          onPress={handleSave}
          disabled={!pin || saving}
        >
          {saving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="white" />
              <Text style={styles.saveBtnText}>Save this location</Text>
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
  mapWrap: { flex: 1 },
  locateBtn: {
    position: "absolute",
    right: 16,
    bottom: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  footer: {
    padding: 16,
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  hintRow: { flexDirection: "row", gap: 10, alignItems: "flex-start" },
  hint: { flex: 1, fontSize: 13, color: Colors.textSecondary, lineHeight: 18 },
  saveBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  saveBtnText: { color: "white", fontSize: 16, fontWeight: "700" },
});
