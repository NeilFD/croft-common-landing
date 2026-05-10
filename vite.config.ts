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
        plugins: [
          { name: 'preset-default', params: { overrides: { removeViewBox: false } } },
        ],
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
  build: {
    // Split heavy vendor code out of the main marketing bundle. This is the
    // biggest lever for reducing Total Blocking Time on landing pages, since
    // visitors to crazybear.dev/ no longer download admin/CMS/charts code.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return;
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('@stripe')) return 'vendor-stripe';
          if (id.includes('@capacitor')) return 'vendor-capacitor';
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts';
          if (id.includes('embla-carousel')) return 'vendor-embla';
          if (id.includes('framer-motion')) return 'vendor-motion';
          if (id.includes('@radix-ui')) return 'vendor-radix';
          if (id.includes('react-router')) return 'vendor-router';
          if (id.includes('react-dom') || id.includes('/react/') || id.includes('scheduler')) return 'vendor-react';
          if (id.includes('jspdf') || id.includes('pdfjs')) return 'vendor-pdf';
          if (id.includes('react-helmet')) return 'vendor-helmet';
          if (id.includes('@tanstack')) return 'vendor-query';
          return 'vendor';
        },
      },
    },
  },
}));
