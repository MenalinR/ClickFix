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

module.exports = { geocodeAddress };
