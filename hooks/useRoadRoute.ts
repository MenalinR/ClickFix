import { useEffect, useRef, useState } from "react";
import type { LatLng } from "../components/LiveTrackingMap";
import { api, apiCall } from "../constants/api";

// Rough distance in metres between two points (haversine).
function distanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Only re-request Directions once the origin has moved this far, so we don't
// spend a (billed) Directions call on every GPS ping.
const REFETCH_THRESHOLD_M = 150;

/**
 * Fetches a real road route (via the backend Directions proxy) between origin
 * and destination, refetching only when the origin moves meaningfully.
 * Returns the decoded polyline plus distance/ETA text. Falls back silently
 * (empty route) when directions aren't configured or fail.
 */
export function useRoadRoute(
  origin: LatLng | null,
  destination: LatLng | null | undefined,
  token?: string | null,
) {
  const [routeCoords, setRouteCoords] = useState<LatLng[]>([]);
  const [distanceText, setDistanceText] = useState<string | undefined>();
  const [durationText, setDurationText] = useState<string | undefined>();
  const lastOrigin = useRef<LatLng | null>(null);

  useEffect(() => {
    if (!origin || !destination || !token) return;
    if (
      lastOrigin.current &&
      routeCoords.length > 0 &&
      distanceMeters(lastOrigin.current, origin) < REFETCH_THRESHOLD_M
    ) {
      return; // origin hasn't moved enough to justify a new request
    }

    let cancelled = false;
    (async () => {
      try {
        const url = api.jobs.directions(
          `${origin.latitude},${origin.longitude}`,
          `${destination.latitude},${destination.longitude}`,
        );
        const res = await apiCall(url, "GET", undefined, token);
        if (cancelled) return;
        if (res?.success && res.data?.points?.length) {
          setRouteCoords(res.data.points);
          setDistanceText(res.data.distance);
          setDurationText(res.data.duration);
          lastOrigin.current = origin;
        }
      } catch {
        // silent — map falls back to the straight connector
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    origin?.latitude,
    origin?.longitude,
    destination?.latitude,
    destination?.longitude,
    token,
  ]);

  return { routeCoords, distanceText, durationText };
}
