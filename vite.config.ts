import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { ViteImageOptimizer } from "vite-plugin-image-optimizer";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  define: {
    'import.meta.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    // Auto-compress every image emitted by the build (src/assets imports
    // and public/ assets). Massively reduces hero/carousel weight which is
    // currently the dominant LCP bottleneck.
    ViteImageOptimizer({
      jpg: { quality: 72, mozjpeg: true },
      jpeg: { quality: 72, mozjpeg: true },
      png: { quality: 80 },
      webp: { quality: 75 },
      avif: { quality: 60 },
      svg: {
        multipass: true,
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: [
      '@capacitor/core',
      '@capacitor/status-bar',
      '@capacitor/push-notifications',
      '@capacitor/app',
      '@capacitor/browser',
    ],
  },
}));
