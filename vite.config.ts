import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // If VITE_API_BASE_URL is set, the frontend will call the backend directly
  // and this proxy won't be used. Otherwise, proxy to localhost:8000 by default.
  const proxyTarget = env.VITE_API_BASE_URL || "http://localhost:8000";
  return {
    server: {
      host: "::",
      port: 8080,
      proxy: env.VITE_API_BASE_URL
        ? undefined
        : {
            "/api": {
              target: proxyTarget,
              changeOrigin: true,
              secure: false,
            },
          },
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
