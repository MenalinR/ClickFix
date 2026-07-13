import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { Colors } from "@/constants/Colors";

export interface LatLng {
  latitude: number;
  longitude: number;
}

interface Props {
  /** Live position of the moving party (the worker). */
  workerCoords: LatLng | null;
  /** Fixed destination (the hardware shop / customer). */
  destination?: LatLng | null;
  workerLabel?: string;
  destinationLabel?: string;
  destinationColor?: string;
  /** Small overlay banner, e.g. "On the way to the shop". */
  bannerText?: string;
  /** Message shown before any location is available. */
  emptyText?: string;
  height?: number;
}

/**
 * Reusable live-tracking map: a moving worker marker, an optional fixed
 * destination marker, and a straight connector line between them, kept framed
 * on both. Used by the worker's pickup-route screen and the shop's
 * track-worker screen.
 */
export default function LiveTrackingMap({
  workerCoords,
  destination,
  workerLabel = "Worker",
  destinationLabel = "Destination",
  destinationColor = Colors.accent,
  bannerText,
  emptyText = "Waiting for live location…",
  height = 260,
}: Props) {
  const mapRef = useRef<MapView | null>(null);

  useEffect(() => {
    if (!workerCoords || !mapRef.current) return;
    if (destination) {
      mapRef.current.fitToCoordinates([workerCoords, destination], {
        edgePadding: { top: 90, right: 90, bottom: 90, left: 90 },
        animated: true,
      });
    } else {
      mapRef.current.animateToRegion(
        { ...workerCoords, latitudeDelta: 0.02, longitudeDelta: 0.02 },
        500,
      );
    }
  }, [workerCoords, destination]);

  const center = workerCoords || destination;

  if (!center) {
    return (
      <View style={[styles.placeholder, { height }]}>
        <Ionicons name="location-outline" size={28} color={Colors.textSecondary} />
        <Text style={styles.placeholderText}>{emptyText}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: center.latitude,
          longitude: center.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {destination && (
          <Marker
            coordinate={destination}
            title={destinationLabel}
            pinColor={destinationColor}
          />
        )}
        {workerCoords && (
          <Marker coordinate={workerCoords} title={workerLabel}>
            <View style={styles.workerMarker}>
              <Ionicons name="navigate" size={16} color="white" />
            </View>
          </Marker>
        )}
        {workerCoords && destination && (
          <Polyline
            coordinates={[workerCoords, destination]}
            strokeColor={Colors.primary}
            strokeWidth={3}
            lineDashPattern={[6, 6]}
          />
        )}
      </MapView>

      {!!bannerText && (
        <View style={styles.banner}>
          <View style={styles.liveDot} />
          <Text style={styles.bannerText}>{bannerText}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  placeholder: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.lightBackground,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 24,
  },
  placeholderText: {
    fontSize: 12,
    color: Colors.textSecondary,
    textAlign: "center",
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
  banner: {
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
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#4CAF50" },
  bannerText: { color: "white", fontSize: 12, fontWeight: "600" },
});
