import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg"],
      manifest: {
        name: "Gestion Projet OS — Plateforme de gestion de projets",
        short_name: "GPO",
        description: "Gestion de projets, finances, logistique et RH pour ONG et acteurs du développement.",
        lang: "fr",
        start_url: "/",
        display: "standalone",
        background_color: "#101B33",
        theme_color: "#101B33",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
      workbox: {
        // App shell (JS/CSS/HTML) mis en cache pour un chargement quasi
        // instantané et une installabilité réelle, y compris hors-ligne.
        globPatterns: ["**/*.{js,css,html,svg,png,ico}"],
        // Lectures API en cache "NetworkFirst" : en ligne, on prend toujours
        // la donnée la plus fraîche ; hors-ligne, on retombe sur la dernière
        // réponse connue plutôt qu'un écran vide. Les écritures (POST/PATCH/
        // DELETE) ne sont PAS mises en cache — elles nécessitent une
        // connexion active, il n'y a pas de file d'attente de synchronisation
        // (voir limite documentée dans le README principal).
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) => request.method === "GET" && url.pathname.startsWith("/api/"),
            handler: "NetworkFirst",
            options: {
              cacheName: "api-reads-cache",
              networkTimeoutSeconds: 4,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 }, // 24h
            },
          },
        ],
      },
    }),
  ],
  server: { port: 5173 },
});
