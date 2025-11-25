import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import viteCompression from "vite-plugin-compression";
import { visualizer } from "rollup-plugin-visualizer";
export default defineConfig(({ mode }) => ({
  define: {
    // Reflect actual mode for libraries that read NODE_ENV
    'process.env.NODE_ENV': JSON.stringify(mode),
  },
  plugins: [
    react(),
    // Generate gzip & brotli assets for production
    viteCompression({ algorithm: 'gzip', ext: '.gz' }),
    viteCompression({ algorithm: 'brotliCompress', ext: '.br' }),
    // Bundle analysis (open dist/stats.html after build)
    visualizer({ filename: "dist/stats.html", template: "treemap", gzipSize: true, brotliSize: true, open: false }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client", "src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@assets": path.resolve(__dirname, "attached_assets"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: mode === 'development',
    minify: 'esbuild',
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (/[\\/]node_modules[\/](react|react-dom|scheduler|use-sync-external-store)[\/]/.test(id)) {
              return 'react-core';
            }
            if (/[@]radix-ui/.test(id)) return 'radix';
            if (/react-query/.test(id)) return 'react-query';
            if (/date-fns/.test(id)) return 'date-fns';
            if (/react-hook-form|@hookform|zod/.test(id)) return 'forms';
            if (/recharts/.test(id)) return 'charts';
            return 'vendor';
          }
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: ({ name }) => {
          if (name && /\.css$/.test(name)) return 'assets/[name]-[hash][extname]';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  esbuild: {
    // Allow dropping console logs in production with env DROP_CONSOLE=true
    drop: process.env.DROP_CONSOLE === 'true' ? ['console'] : [],
    legalComments: 'none',
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
}));
