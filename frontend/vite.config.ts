import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// §15: Vite + React + TypeScript. Las variables siguen llamándose REACT_APP_*
// porque la plataforma las inyecta así (frontend/.env).
export default defineConfig({
  plugins: [react()],
  envPrefix: ["VITE_", "REACT_APP_"],
  server: {
    host: true,
    port: 3000,
    strictPort: true,
    allowedHosts: true,
    hmr: { clientPort: 443, protocol: "wss" },
  },
  preview: { host: true, port: 3000 },
  build: { outDir: "build" },
});
