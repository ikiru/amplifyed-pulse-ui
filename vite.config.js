import { defineConfig } from "vite";

export default defineConfig({
  server: {
    port: 5173
  },
  plugins: [
    {
      name: "startup-banner",
      configureServer(server) {
        server.httpServer?.once("listening", () => {
          const address = server.httpServer.address();
          if (address && typeof address === "object") {
            console.log("\n-------------------------------------------");
            console.log(" 🖥️  Vite Frontend is RUNNING ");
            console.log(` 🌐  http://localhost:${address.port}`);
            console.log("-------------------------------------------\n");
          }
        });
      }
    }
  ]
});
