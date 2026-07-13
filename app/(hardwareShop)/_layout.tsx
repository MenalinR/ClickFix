import { Stack } from "expo-router";
import React from "react";

export default function HardwareShopLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="track-worker" />
    </Stack>
  );
}
