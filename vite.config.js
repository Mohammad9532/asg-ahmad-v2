import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
    root: 'client', // Frontend source root
    publicDir: 'public', // Static assets
    server: {
        port: 5173,
        proxy: {
            '/api': {
                target: 'http://localhost:3000', // Proxy API requests to Express backend
                changeOrigin: true,
                secure: false,
            },
        },
    },
    build: {
        outDir: '../dist', // Build output outside 'client'
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'client/index.html'),
                login: resolve(__dirname, 'client/login.html'),
            },
        },
    },
    resolve: {
        alias: {
            '~': resolve(__dirname, 'client/src'), // Alias for cleaner imports
            '@': resolve(__dirname, 'client/src'),
        },
    },
});
