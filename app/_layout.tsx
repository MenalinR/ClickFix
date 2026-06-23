import { Slot } from "expo-router";
// Registers the background live-location task (must run at startup so the OS
// can deliver background location events even when no screen is mounted).
import "../services/locationTask";

export default function RootLayout() {
  return <Slot />;
}
