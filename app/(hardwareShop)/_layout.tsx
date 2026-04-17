import { useRouter } from "expo-router";
import React from "react";
import { Stack } from "expo-router";

export default function HardwareShopLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}
