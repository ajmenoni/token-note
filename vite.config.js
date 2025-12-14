import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Serve from site root
  base: "/",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"), // Your main React entry
        background: resolve(__dirname, "background.html"), // Copy background.html as a separate entry
      },
    },
  },
});
