import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

// Name of the background location task. Exported so the hook can start/stop it.
export const LOCATION_TASK_NAME = "clickfix-live-location";

// AsyncStorage key holding the active tracking target. The background task can
// fire when no React component is mounted, so everything it needs (the REST
// endpoint, auth token and trip phase) is persisted here by useLocationBroadcast.
export const TRACKING_STATE_KEY = "clickfix-tracking-state";

export interface TrackingState {
  url: string; // fully-built PUT /jobs/:id/live-location endpoint
  token: string;
  phase: string; // "coming" | "On the way" | "In progress"
}

// Defined at module scope so the registration survives app restarts. This file
// is imported from app/_layout.tsx so the task is always registered before the
// OS tries to deliver background location events.
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return;
  const locations = (data as any)?.locations as Location.LocationObject[];
  if (!locations || locations.length === 0) return;

  let raw: string | null = null;
  try {
    raw = await AsyncStorage.getItem(TRACKING_STATE_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  let state: TrackingState;
  try {
    state = JSON.parse(raw);
  } catch {
    return;
  }
  if (!state?.url || !state?.token) return;

  // Only the freshest fix matters for a live marker.
  const { coords } = locations[locations.length - 1];

  try {
    await fetch(state.url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${state.token}`,
      },
      body: JSON.stringify({
        latitude: coords.latitude,
        longitude: coords.longitude,
        heading: coords.heading,
        speed: coords.speed,
        phase: state.phase,
      }),
    });
  } catch {
    // Non-fatal — the next fix will retry.
  }
});
