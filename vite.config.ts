import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react-swc";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
      "@convex": path.resolve(__dirname, "./convex"),
      "@worker": path.resolve(__dirname, "./worker"),
      "@server": path.resolve(__dirname, "./server"),
    },
  },
});
