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

// Default to Colombo when there's no saved address and GPS is unavailable.
const DEFAULT_REGION = {
  latitude: 6.9271,
  longitude: 79.8612,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function SetCustomerLocationScreen() {
  const router = useRouter();
  const { user, token, setUser } = useStore();
  const customer = user as any;
  const customerId = customer?._id || customer?.id;

  // Start the pin on the customer's default/latest saved address, if any.
  const savedCoords: LatLng | null = (() => {
    const addresses = (customer?.addresses || []) as any[];
    const chosen =
      addresses.find((a) => a.isDefault) ||
      addresses[addresses.length - 1] ||
      null;
    const coords = chosen?.location?.coordinates;
    return coords?.length === 2
      ? { longitude: coords[0], latitude: coords[1] }
      : null;
  })();

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
  // Does NOT save — the customer still presses Save.
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
    if (!token || !customerId) {
      Alert.alert("Error", "Please login again.");
      return;
    }
    if (!pin) {
      Alert.alert(
        "Drop a pin first",
        "Tap on the map (or drag the pin) to mark your location.",
      );
      return;
    }
    try {
      setSaving(true);

      // Resolve the pin into a readable address + city on-device (uses the
      // phone's OS geocoder, no billed Google API needed). Best-effort.
      let address: string | undefined;
      let city: string | undefined;
      try {
        const [place] = await Location.reverseGeocodeAsync({
          latitude: pin.latitude,
          longitude: pin.longitude,
        });
        if (place) {
          const streetLine = [place.streetNumber, place.street]
            .filter(Boolean)
            .join(" ");
          const parts = [place.name, streetLine, place.district].filter(
            (p): p is string => !!p,
          );
          address =
            (place as any).formattedAddress ||
            [...new Set(parts)].join(", ") ||
            undefined;
          city = place.city || place.subregion || place.region || undefined;
        }
      } catch {
        // ignore — coordinates still get saved
      }

      const res = await apiCall(
        api.customers.addAddress(customerId),
        "POST",
        {
          label: "Home",
          address: address || "Pinned location",
          city: city || "",
          makeDefault: true,
          location: {
            type: "Point",
            coordinates: [pin.longitude, pin.latitude],
          },
        },
        token,
      );
      if (!res?.success) throw new Error(res?.message || "Could not save location");

      // Keep the store's addresses in sync so the profile reflects it.
      setUser({ ...(user as any), addresses: res.data?.addresses || [] });
      Alert.alert(
        "Saved",
        address
          ? "Your location is set. Address and city were updated to match, and workers will be routed here."
          : "Your location is set and workers will be routed here. (Couldn't auto-fill the address for this spot — you can edit it manually in your profile.)",
      );
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
        <Text style={styles.title}>Set your location</Text>
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
              title="Your location"
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
            Tap the map or drag the pin to your exact spot, then Save. This is
            where workers will be routed for your bookings.
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
