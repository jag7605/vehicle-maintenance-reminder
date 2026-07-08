import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      // injectManifest (instead of the default generateSW) lets us provide
      // our own service worker source file with custom logic — in this
      // case, the push event listener that displays browser notifications.
      // generateSW auto-generates the whole file and has no supported way
      // to inject arbitrary event listeners like "push".
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      injectManifest: {
        // Workbox's precache manifest gets injected wherever
        // `self.__WB_MANIFEST` appears in src/sw.js
        injectionPoint: "self.__WB_MANIFEST",
      },
      manifest: {
        name: "Vehicle Maintenance Reminder",
        short_name: "VehicleApp",
        description: "Garage vehicle maintenance reminder system",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "/icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
});