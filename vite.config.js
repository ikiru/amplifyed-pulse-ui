import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
    host: "127.0.0.1", // Enforce localhost to avoid EPERM errors when binding to 0.0.0.0.
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 24678,
      path: "/vite-hmr",
    },
    proxy: {
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
  },
});
