import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { api } from "../constants/api";
import { config } from "../constants/config";
import {
  LOCATION_TASK_NAME,
  TRACKING_STATE_KEY,
  TrackingState,
} from "../services/locationTask";

const socketBaseURL = () => {
  const base = config.api.baseURL || "";
  return base.replace(/\/api\/?$/, "");
};

interface Options {
  jobId?: string | null;
  // Which leg of the trip: "coming" (to shop), "On the way" or "In progress".
  phase: string;
  // Master switch — broadcasting only runs while this is true.
  active: boolean;
  token?: string | null;
}

/**
 * Streams the worker's GPS position to the customer while `active` is true.
 *
 * Two complementary paths:
 *  - Foreground: a watchPositionAsync subscription emits "worker-location-update"
 *    over Socket.io for low-latency updates while the app is open.
 *  - Background: expo-location's background task (see services/locationTask.ts)
 *    POSTs fixes to the REST endpoint when the app is minimised/locked.
 *
 * The server relays both onto the per-job "worker-location" room the customer
 * listens on, so the customer sees a continuous stream either way.
 */
export function useLocationBroadcast({ jobId, phase, active, token }: Options) {
  const socketRef = useRef<Socket | null>(null);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    const stop = async () => {
      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      try {
        const started =
          await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (started) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      } catch {
        // ignore
      }
      try {
        await AsyncStorage.removeItem(TRACKING_STATE_KEY);
      } catch {
        // ignore
      }
    };

    const start = async () => {
      if (!jobId || !token) return;

      const fg = await Location.requestForegroundPermissionsAsync();
      if (!fg.granted || cancelled) return;
      // Best-effort: background keeps tracking alive when minimised. Foreground
      // streaming still works even if the user declines this.
      try {
        await Location.requestBackgroundPermissionsAsync();
      } catch {
        // ignore
      }
      if (cancelled) return;

      // Persist what the background task needs (it runs without React context).
      const state: TrackingState = {
        url: api.jobs.liveLocation(jobId),
        token,
        phase,
      };
      try {
        await AsyncStorage.setItem(TRACKING_STATE_KEY, JSON.stringify(state));
      } catch {
        // ignore
      }

      // Foreground live stream over the socket.
      const socket = io(socketBaseURL(), { transports: ["websocket"] });
      socketRef.current = socket;
      watchRef.current = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 15,
        },
        (loc) => {
          socket.emit("worker-location-update", {
            jobId,
            phase,
            coords: {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              heading: loc.coords.heading,
              speed: loc.coords.speed,
            },
          });
        },
      );

      // Background updates (Android runs these via a foreground service).
      try {
        const alreadyStarted =
          await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        if (!alreadyStarted) {
          await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
            accuracy: Location.Accuracy.High,
            timeInterval: 8000,
            distanceInterval: 25,
            pausesUpdatesAutomatically: false,
            showsBackgroundLocationIndicator: true,
            foregroundService: {
              notificationTitle: "ClickFix — sharing your location",
              notificationBody:
                "Your location is shared with the customer while this job is active.",
              notificationColor: "#0F4C75",
            },
          });
        }
      } catch {
        // ignore — foreground streaming still works
      }
    };

    if (active && jobId && token) {
      start();
    } else {
      stop();
    }

    return () => {
      cancelled = true;
      stop();
    };
  }, [active, jobId, phase, token]);
}
