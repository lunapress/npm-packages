import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(() => {
    return {
        build: {
            manifest: true,
            emptyOutDir: true,
            rollupOptions: {
                input: ['src/module/TestNotice/index.tsx'],
            },
        },
    }
})