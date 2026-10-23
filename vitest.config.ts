import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  test: {
    include: ["server/**/*.test.ts", "src/**/*.test.ts?(x)"],
    environment: "node",
  },
});
