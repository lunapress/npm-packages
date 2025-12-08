import { z } from 'zod'
import { createJiti, Jiti } from 'jiti'
import fs from 'node:fs'

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
}

export const lunaPressConfigSchema = z.object({
    viteConfigPath: z.string().optional(),
})

export const resolveLunaPressConfig = async (params: {
    configPath: string
    initializedJiti?: Jiti
}): Promise<LunaPressConfig | null> => {
    try {
        const { configPath, initializedJiti } = params
        let jiti = initializedJiti

        if (!fs.existsSync(configPath)) {
            return null
        }

        if (!jiti) {
            jiti = createJiti(import.meta.url)
        }

        const lunaConfigExport = await jiti.import<{ default?: unknown }>(configPath)
        const lunaConfigRaw = lunaConfigExport.default ?? lunaConfigExport
        const lunaConfig = await lunaPressConfigSchema.safeParseAsync(lunaConfigRaw)

        return lunaConfig.success ? lunaConfig.data : null
    } catch {
        return null
    }
}

export const LUNAPRESS_DEFAULT_CONFIG_NAME = 'lunapress.config.ts'

/**
 * Helper to define configuration with type safety.
 */
export function defineConfig(config: LunaPressConfig): LunaPressConfig {
    return config
}
