/**
 * Configuration interface for LunaPress
 */
export interface LunaPressConfig {
    /**
     * Optional path to the Vite configuration file.
     * Use this if your vite config is not in the root or named differently.
     * @example './configs/vite.custom.ts'
     */
    viteConfigPath?: string

    /**
     * Config for LunaPress CLI, which generates JSON with translations for .pot
     */
    i18n?: {
        /**
         * Entry points for your application.
         * The translation extractor will start with these files and resolve the dependency graph.
         * * @example ['src/modules/dashboard/index.ts', 'src/modules/user/index.tsx']
         */
        inputs: string[]
    }
}

/**
 * Helper to define configuration with type safety.
 */
export function defineConfig(config: LunaPressConfig): LunaPressConfig {
    return config
}
