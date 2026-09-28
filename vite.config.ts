import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig(({ mode }) => ({
  // The Cloudflare plugin runs the /api Worker alongside the site in dev and preview (not in unit tests).
  plugins: [react(), tailwindcss(), ...(mode === "test" ? [] : [cloudflare()])],
  build: {
    // three.js is one large chunk, loaded only when the 3D view opens.
    chunkSizeWarningLimit: 700,
    rolldownOptions: {
      output: {
        // Keep framework code in its own long-cacheable chunk.
        codeSplitting: {
          groups: [{ name: "vendor", test: /node_modules[\/](react|react-dom|react-router|scheduler)[\/]/ }],
        },
      },
    },
  },
  test: {
    include: ["src/**/*.test.ts"],
  },
}) as UserConfig);
