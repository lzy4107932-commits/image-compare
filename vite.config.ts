import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { getContentSecurityPolicy } from "./config/contentSecurityPolicy.js";

function contentSecurityPolicyPlugin(policy: string): Plugin {
  return {
    name: "image-compare-content-security-policy",
    enforce: "pre",
    transformIndexHtml(html) {
      return html.replace("__IMAGE_COMPARE_CSP__", policy);
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: "./",
  plugins: [
    react(),
    contentSecurityPolicyPlugin(getContentSecurityPolicy(command === "serve")),
  ],
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  build: {
    outDir: "dist-renderer",
    emptyOutDir: true,
  },
}));
