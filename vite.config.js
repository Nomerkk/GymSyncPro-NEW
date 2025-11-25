"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const vite_1 = require("vite");
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
const path_1 = __importDefault(require("path"));
const vite_plugin_compression_1 = __importDefault(require("vite-plugin-compression"));
const rollup_plugin_visualizer_1 = require("rollup-plugin-visualizer");
exports.default = (0, vite_1.defineConfig)({
    plugins: [
        (0, plugin_react_1.default)(),
        // Generate gzip & brotli assets for production
        (0, vite_plugin_compression_1.default)({ algorithm: 'gzip', ext: '.gz' }),
        (0, vite_plugin_compression_1.default)({ algorithm: 'brotliCompress', ext: '.br' }),
        // Bundle analysis (open dist/stats.html after build)
        (0, rollup_plugin_visualizer_1.visualizer)({ filename: "dist/stats.html", template: "treemap", gzipSize: true, brotliSize: true, open: false }),
        // Removed Replit-specific plugins (ESM-only) to keep local dev build compatible
    ],
    resolve: {
        alias: {
            "@": path_1.default.resolve(__dirname, "client", "src"),
            "@shared": path_1.default.resolve(__dirname, "shared"),
            "@assets": path_1.default.resolve(__dirname, "attached_assets"),
        },
    },
    root: path_1.default.resolve(__dirname, "client"),
    build: {
        outDir: path_1.default.resolve(__dirname, "dist/public"),
        emptyOutDir: true,
        rollupOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (id.includes('react'))
                            return 'react';
                        if (id.includes('@radix-ui') || id.includes('class-variance-authority') || id.includes('clsx'))
                            return 'ui';
                        if (id.includes('@tanstack'))
                            return 'query';
                        if (id.includes('date-fns'))
                            return 'date';
                        if (id.includes('recharts'))
                            return 'charts';
                        if (id.includes('html5-qrcode') || id.includes('qrcode'))
                            return 'qr';
                        if (id.includes('zod'))
                            return 'zod';
                        if (id.includes('lucide-react'))
                            return 'icons';
                        return 'vendor';
                    }
                }
            }
        }
    },
    server: {
        fs: {
            strict: true,
            deny: ["**/.*"],
        },
    },
});
