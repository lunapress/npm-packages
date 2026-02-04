import { defineConfig } from 'tsdown'

export default defineConfig({
    entry: ['src/**/*.ts'],
    unbundle: true,
    skipNodeModulesBundle: true,
    dts: {
        tsgo: true,
    },
    external: ['@lunapress/config'],
    tsconfig: 'tsconfig.build.json',
})