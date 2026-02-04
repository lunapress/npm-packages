import { defineConfig } from 'vite'
import { join } from 'node:path'

// https://vite.dev/config/
export default defineConfig(() => {
    return {
        build: {
            manifest: true,
            emptyOutDir: true,
            rollupOptions: {
                input: ['@module/TestNotice/index.tsx'],
            },
        },
        resolve: {
            alias: [
                {
                    find: '@module',
                    replacement: join(__dirname, 'src/module'),
                },
            ],
        },
    }
})