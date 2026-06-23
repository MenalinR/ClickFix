// Dynamic Expo config: starts from app.json and injects the Google Maps API key
// from the environment so the secret stays out of source control.
//
// Set the key in your local .env (which is gitignored), e.g.:
//   EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=AIza...your-key...
//
// The key is read at prebuild/build time and written into the native projects.
const appJson = require("./app.json");

module.exports = () => {
  const googleMapsKey =
    process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    "";

  const expo = { ...appJson.expo };

  expo.ios = {
    ...expo.ios,
    config: {
      ...(expo.ios && expo.ios.config),
      googleMapsApiKey: googleMapsKey,
    },
  };

  expo.android = {
    ...expo.android,
    config: {
      ...(expo.android && expo.android.config),
      googleMaps: {
        ...(expo.android && expo.android.config && expo.android.config.googleMaps),
        apiKey: googleMapsKey,
      },
    },
  };

  return { expo };
};
