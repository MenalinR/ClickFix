import * as Location from "expo-location";
import { Alert, Linking } from "react-native";

interface Destination {
  latitude: number;
  longitude: number;
}

/**
 * Opens the device's Google Maps app (or browser fallback) with turn-by-turn
 * directions from the worker's current live GPS position to `destination`.
 */
export async function openGoogleMapsDirections(destination: Destination) {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== "granted") {
    Alert.alert(
      "Location permission needed",
      "Allow location access to start navigation from your current position.",
    );
    return;
  }

  let origin = "";
  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.High,
    });
    origin = `${pos.coords.latitude},${pos.coords.longitude}`;
  } catch {
    // Fall back to letting Google Maps use its own current-location origin.
  }

  const dest = `${destination.latitude},${destination.longitude}`;
  let url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(dest)}&travelmode=driving`;
  if (origin) {
    url += `&origin=${encodeURIComponent(origin)}`;
  }

  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      "Couldn't open Maps",
      "Please make sure you have a maps app installed.",
    );
  }
}
