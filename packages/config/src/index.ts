import { z } from 'zod'
import { createJiti, Jiti } from 'jiti'

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

export const lunaPressConfigSchema = z.object({
    viteConfigPath: z.string().optional(),
    i18n: z
        .object({
            inputs: z.array(z.string()),
        })
        .optional(),
})

export const resolveLunaPressConfig = async (params: {
    configPath: string
    initializedJiti?: Jiti
}): Promise<LunaPressConfig | undefined> => {
    const { configPath, initializedJiti } = params
    let jiti = initializedJiti

    if (jiti === undefined) {
        jiti = createJiti(import.meta.url)
    }

    const lunaConfigExport = await jiti.import<{ default?: unknown }>(configPath)
    const lunaConfigRaw = lunaConfigExport.default || lunaConfigExport
    const lunaConfig = await lunaPressConfigSchema.safeParseAsync(lunaConfigRaw)

    return lunaConfig.data
}

export const LUNAPRESS_DEFAULT_CONFIG_NAME = 'lunapress.config.ts'

/**
 * Helper to define configuration with type safety.
 */
export function defineConfig(config: LunaPressConfig): LunaPressConfig {
    return config
}
