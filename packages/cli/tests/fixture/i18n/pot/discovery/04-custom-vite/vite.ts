import { defineConfig } from 'vite'
import { join } from 'node:path'

// https://vite.dev/config/
export default defineConfig(() => {
    return {
        build: {
            rollupOptions: {
                input: ['@module/TestNotice/index.ts'],
            },
        },
    }
})
