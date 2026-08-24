// Resolves a free-text address into GeoJSON [longitude, latitude] coordinates
// using the Google Geocoding API. Returns null (never throws) when the API
// key is missing, the address can't be resolved, or the request fails —
// callers should treat geocoding as a best-effort enhancement, not a
// required step.
async function geocodeAddress({ address, city }) {
  const query = [address, city].filter(Boolean).join(", ");
  if (!query) return null;

  const key =
    process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_DIRECTIONS_API_KEY;
  if (!key) return null;

  try {
    // Bias/restrict results to Sri Lanka — without this, a short local
    // place name (e.g. a Colombo neighbourhood) can resolve to an
    // unrelated place anywhere in the world.
    const url =
      "https://maps.googleapis.com/maps/api/geocode/json" +
      `?address=${encodeURIComponent(query)}` +
      `&components=country:LK` +
      `&key=${key}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" || !data.results || !data.results.length) {
      return null;
    }

    const { lat, lng } = data.results[0].geometry.location;
    return [lng, lat];
  } catch {
    return null;
  }
}

// Resolves GeoJSON coordinates (or lat/lng) back into a human-readable
// address + city using the Google Reverse Geocoding API. Returns null (never
// throws) when the key is missing or the lookup fails — callers should treat
// this as best-effort.
async function reverseGeocode({ latitude, longitude }) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  const key =
    process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_DIRECTIONS_API_KEY;
  if (!key) return null;

  try {
    const url =
      "https://maps.googleapis.com/maps/api/geocode/json" +
      `?latlng=${latitude},${longitude}` +
      `&key=${key}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" || !data.results || !data.results.length) {
      return null;
    }

    const best = data.results[0];
    const address = best.formatted_address || "";

    // Pull the city from the address components. In Sri Lanka the city is
    // usually the "locality"; fall back to the wider admin areas.
    const components = best.address_components || [];
    const pick = (type) =>
      components.find((c) => c.types.includes(type))?.long_name;
    const city =
      pick("locality") ||
      pick("administrative_area_level_2") ||
      pick("administrative_area_level_1") ||
      "";

    return { address, city };
  } catch {
    return null;
  }
}

// Resolves the driving distance (in km) between two points using the Google
// Directions API. Points are [longitude, latitude] (GeoJSON convention).
// Returns null (never throws) when the key is missing or the request fails —
// callers should treat this as best-effort and skip the fee rather than
// block the caller's flow.
async function getRoadDistanceKm(originCoords, destinationCoords) {
  if (
    !Array.isArray(originCoords) ||
    !Array.isArray(destinationCoords) ||
    originCoords.length !== 2 ||
    destinationCoords.length !== 2
  ) {
    return null;
  }

  const key =
    process.env.GOOGLE_MAPS_API_KEY || process.env.GOOGLE_DIRECTIONS_API_KEY;
  if (!key) return null;

  try {
    const origin = `${originCoords[1]},${originCoords[0]}`;
    const destination = `${destinationCoords[1]},${destinationCoords[0]}`;
    const url =
      "https://maps.googleapis.com/maps/api/directions/json" +
      `?origin=${encodeURIComponent(origin)}` +
      `&destination=${encodeURIComponent(destination)}` +
      `&mode=driving&key=${key}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK" || !data.routes || !data.routes.length) {
      return null;
    }

    const leg = data.routes[0].legs && data.routes[0].legs[0];
    const meters = leg?.distance?.value;
    return typeof meters === "number" ? meters / 1000 : null;
  } catch {
    return null;
  }
}

module.exports = { geocodeAddress, reverseGeocode, getRoadDistanceKm };
