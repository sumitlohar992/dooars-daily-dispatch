// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using Cloudflare by default), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const nitroOptions = {
  preset: process.env["VERCEL"] ? "vercel" : "cloudflare-module",
  serverDir: "./server",
  experimental: { tasks: true },
  tasks: {
    "google-news": {
      description: "Import new Dooars-region stories from Google News.",
    },
  },
  scheduledTasks: {
    [process.env["VERCEL"] ? "0 0 * * *" : "*/30 * * * *"]: ["google-news"],
  },
};

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  nitro: nitroOptions,
});
