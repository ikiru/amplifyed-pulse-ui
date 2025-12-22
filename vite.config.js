import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  server: {
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
});
