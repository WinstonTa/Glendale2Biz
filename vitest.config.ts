import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const root = path.dirname(fileURLToPath(import.meta.url));

// QA-owned. Tests are pure: no network, no secrets. GIS_MODE is forced to mock.
export default defineConfig({
  resolve: {
    alias: [{ find: /^@\//, replacement: `${root.replace(/\\/g, "/")}/` }],
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    env: {
      GIS_MODE: "mock",
    },
  },
});
