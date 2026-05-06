import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "healtour-logo.jpeg"],
      manifest: {
        name: "Healtour · AP Health IQ",
        short_name: "Healtour",
        description: "Healtour — AI-Enabled Disease Tracking & Health Data Intelligence Platform · Govt. of Andhra Pradesh. Click. Fly. Heal.",
        theme_color: "#10b981",
        background_color: "#000000",
        display: "standalone",
        scope: "/",
        start_url: "/login",
        icons: [
          { src: "/healtour-logo.jpeg", sizes: "192x192", type: "image/jpeg", purpose: "any maskable" },
          { src: "/healtour-logo.jpeg", sizes: "512x512", type: "image/jpeg", purpose: "any maskable" },
        ],
      },
      workbox: {
        // Cache the app shell + Leaflet tiles + API district data
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webp}"],
        runtimeCaching: [
          {
            // Cache GET API responses for offline reads
            urlPattern: /\/api\/(districts|diseases|phcs|field\/mandals|field\/signals)/,
            handler: "NetworkFirst",
            options: {
              cacheName: "ap-health-api",
              expiration: { maxEntries: 50, maxAgeSeconds: 24 * 60 * 60 },
              networkTimeoutSeconds: 5,
            },
          },
          {
            // Cache map tiles (only the AP region area gets cached as users navigate)
            urlPattern: /^https:\/\/[a-c]\.tile\.openstreetmap\.org/,
            handler: "CacheFirst",
            options: {
              cacheName: "osm-tiles",
              expiration: { maxEntries: 200, maxAgeSeconds: 7 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
