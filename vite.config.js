import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// ---------------------------------------------
// AmplifyEd Vite Config (CI-safe version)
// ---------------------------------------------
// This config ensures:
//   • Vite builds ONLY the React client
//   • Node server code inside /server is excluded
//   • GitHub Actions can run `npm run build`
//   • No bundling errors from socket server files
// ---------------------------------------------

export default defineConfig({
  plugins: [react()],

  // Prevent Vite from analyzing /server node code
  optimizeDeps: {
    exclude: ["server"]
  },

  build: {
    rollupOptions: {
      // Prevent bundling backend code
      external: ["server"]
    }
  }
});
