import { defineConfig } from '@lunapress/config'

export default defineConfig({
    viteConfigPath: 'vite.ts',
    i18n: {
        inputs: ['src/module/TestNotice/index.tsx'],
    },
})