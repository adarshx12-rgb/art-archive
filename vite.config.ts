import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
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
} as Parameters<typeof defineConfig>[0]);
