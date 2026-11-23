export default defineNuxtConfig({
  modules: [
    "@nuxt/a11y",
    "@nuxt/eslint",
    "@nuxt/hints",
    "@nuxt/image",
    "@nuxt/ui",
    "@pinia/nuxt",
    "@vite-pwa/nuxt",
  ],
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      title: "Ча Хэ",
      titleTemplate: "%s · Ча Хэ",
      htmlAttrs: {
        lang: "ru",
      },
    },
  },
  ui: {
    fonts: false,
  },
  devServer: {
    port: 3636,
  },

  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "Ча Хэ · Дневник дегустаций",
      short_name: "Ча Хэ",
      description: "Offline-first дневник дегустаций китайского чая",
      theme_color: "#16a34a",
      background_color: "#09090b",
      display: "standalone",
      start_url: "/",
      lang: "ru",
      icons: [
        {
          src: "/pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
        {
          src: "/pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      navigateFallback: "/",
      navigateFallbackDenylist: [/^\/api\//],
    },
    client: {
      installPrompt: true,
    },
    devOptions: {
      enabled: false,
      type: "module",
    },
  },
});
