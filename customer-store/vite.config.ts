import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path"; // <-- Isey import karein

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // Yeh object add karein
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
