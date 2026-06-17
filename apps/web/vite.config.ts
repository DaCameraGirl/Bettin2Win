import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves a project site under /<repo>/; set VITE_BASE to that
  // (e.g. "/Bettin2Win/") at build time. Defaults to "/" for local + custom domains.
  base: process.env.VITE_BASE ?? "/",
  server: {
    port: Number(process.env.WEB_PORT ?? 5173),
  },
});
