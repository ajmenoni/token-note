import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/token-note/",
  server: {
    cors: {
      origin: "https://www.owlbear.rodeo",
    },
    allowedHosts: ["dam-installing-hours-spin.trycloudflare.com"],
  },
});
