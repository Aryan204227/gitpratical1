import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vitest/config";

const rootDirectory = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@": path.join(rootDirectory, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.js"],
    testTimeout: 30000,
    hookTimeout: 60000,
    clearMocks: true,
    restoreMocks: true,
  },
});
