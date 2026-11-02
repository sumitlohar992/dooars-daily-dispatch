import type { CapacitorConfig } from "@capacitor/cli";

// The Android app opens the live published site, so news and app updates appear without reinstalling.
const config: CapacitorConfig = {
  appId: "app.lovable.dooarskhabar",
  appName: "Dooars Khabar",
  webDir: "public",
  server: { url: "https://dooars-daily-dispatch.lovable.app", cleartext: false },
  android: { backgroundColor: "#13307a" },
};

export default config;
