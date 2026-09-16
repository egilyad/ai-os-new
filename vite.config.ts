import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import pkg from './package.json' with { type: 'json' };
import type { ProxyOptions } from 'vite';

function withProxyErrorHandler(opts: ProxyOptions): ProxyOptions {
    return {
        ...opts,
        configure: (proxy) => {
            proxy.on('error', (err, _req, res) => {
                if ('writeHead' in res && !res.headersSent) {
                    try {
                        res.writeHead(502, { 'Content-Type': 'application/json' });
                        res.end(
                            JSON.stringify({
                                error: 'Proxy error',
                                message: err.message,
                                code: 'PROXY_ERROR',
                            }),
                        );
                    } catch {
                        /* ignore write errors after connection close */
                    }
                }
            });
        },
    };
}

// https://vite.dev/config/
export default defineConfig({
    base: process.env.VITE_BASE_PATH || '/',
    define: {
        'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
    },
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'src'),
        },
    },
    build: {
        target: 'es2023',
        // P1.27: generate sourcemaps but keep them out of the shipped JS/CSS
        // (no `//# sourceMappingURL=` emitted). Maps are uploaded to
        // Sentry/Datadog by `scripts/upload-sourcemaps.mjs` and never served
        // to clients, so production source is not leaked.
        sourcemap: 'hidden',
        minify: 'esbuild',
        chunkSizeWarningLimit: 700,
        rollupOptions: {
            external: [],
            output: {
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        if (
                            id.includes('react') ||
                            id.includes('react-dom') ||
                            id.includes('react-router')
                        ) {
                            return 'vendor-react';
                        }
                        if (id.includes('@xyflow')) {
                            return 'vendor-xyflow';
                        }
                        if (
                            id.includes('lucide') ||
                            id.includes('zustand') ||
                            id.includes('zod') ||
                            id.includes('dexie')
                        ) {
                            return 'vendor-utils';
                        }

                        if (id.includes('framer-motion')) {
                            return 'vendor-motion';
                        }
                        if (id.includes('meriyah')) {
                            return 'vendor-ast';
                        }
                        if (id.includes('@tiptap')) {
                            return 'vendor-tiptap';
                        }
                        if (id.includes('@react-aria')) {
                            return 'vendor-aria';
                        }
                        if (id.includes('@orama')) {
                            return 'vendor-orama';
                        }
                        if (id.includes('dompurify')) {
                            return 'vendor-dompurify';
                        }
                        return; // keep other node_modules in the entry chunk
                    }
                    // ── Source code splitting ──
                    if (id.includes('src/kernel/services/debate-runtime/')) {
                        return 'kernel-debate';
                    }
                    if (id.includes('src/llm/')) {
                        return 'kernel-llm';
                    }
                },
            },
        },
    },
    server: {
        headers: {
            'Content-Security-Policy':
                "default-src 'self'; " +
                "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'; " +
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
                "font-src 'self' data: https://fonts.gstatic.com; " +
                "connect-src 'self' https://generativelanguage.googleapis.com https://openrouter.ai https://integrate.api.nvidia.com https://api.groq.com https://api.cerebras.ai https://api.cloudflare.com https://api.openai.com; " +
                "worker-src 'self' blob:; " +
                "img-src 'self' data: blob:;",
        },
        proxy: {
            '/proxy/gemini': withProxyErrorHandler({
                target:
                    process.env.VITE_PROXY_GEMINI || 'https://generativelanguage.googleapis.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/proxy\/gemini/, ''),
                secure: true,
            }),
            '/proxy/openrouter': withProxyErrorHandler({
                target: process.env.VITE_PROXY_OPENROUTER || 'https://openrouter.ai',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/proxy\/openrouter/, ''),
                secure: true,
            }),
            '/proxy/nvidia': withProxyErrorHandler({
                target: process.env.VITE_PROXY_NVIDIA || 'https://integrate.api.nvidia.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/proxy\/nvidia/, ''),
                secure: true,
            }),
            '/proxy/groq': withProxyErrorHandler({
                target: process.env.VITE_PROXY_GROQ || 'https://api.groq.com/openai/v1',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/proxy\/groq/, ''),
                secure: true,
            }),
            '/proxy/cerebras': withProxyErrorHandler({
                target: process.env.VITE_PROXY_CEREBRAS || 'https://api.cerebras.ai/v1',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/proxy\/cerebras/, ''),
                secure: true,
            }),
            '/proxy/cloudflare': withProxyErrorHandler({
                target: process.env.VITE_PROXY_CLOUDFLARE || 'https://api.cloudflare.com/client/v4',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/proxy\/cloudflare/, ''),
                secure: true,
            }),
            '/proxy/openai': withProxyErrorHandler({
                target: process.env.VITE_PROXY_OPENAI || 'https://api.openai.com',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/proxy\/openai/, ''),
                secure: true,
            }),
            // SEC-07: Fetch proxy for sandboxed URL fetching.
            // Default to the local CORS proxy (npm run proxy → :3002).
            // api.allorigins.win was removed as default — it's a privacy leak.
            '/proxy/fetch': {
                target: process.env.VITE_PROXY_FETCH || 'http://localhost:3002/fetch',
                changeOrigin: true,
                secure: false,
            },
            '/api': {
                target: process.env.VITE_API_UPSTREAM || 'https://api.openrouter.ai',
                changeOrigin: true,
                secure: true,
            },
        },
    },
    preview: {
        port: 5173,
        host: true,
    },
});
