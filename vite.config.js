import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  // -------------------------------------------------------------
  // WebSocket proxy: allows frontend to reach Socket.IO backend
  // Ensures ws://localhost:5173/socket.io → http://localhost:3000
  // Required for TrainerView & AudienceInput to connect correctly
  // -------------------------------------------------------------
  server: {
    proxy: {
      "/socket.io": {
        target: "http://localhost:3000",
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
