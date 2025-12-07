import { ResolvedConfig as ViteUserConfig, resolveConfig } from 'vite'
import {
    LUNAPRESS_DEFAULT_CONFIG_NAME,
    type LunaPressConfig,
    resolveLunaPressConfig,
} from '@lunapress/config'
import fg from 'fast-glob'
import fs from 'node:fs'
import path from 'node:path'
import { createJiti } from 'jiti'

export interface ProjectContext {
    name: string
    rootPath: string
    tsConfigPath: string
    viteConfigPath: string
    viteConfig: ViteUserConfig
    lunaPressConfig: LunaPressConfig
}

export interface IProjectDiscovery {
    scan(source: string): Promise<ProjectContext[]>
}

export class ProjectDiscovery implements IProjectDiscovery {
    private jiti = createJiti(import.meta.url)

    public async scan(source: string): Promise<ProjectContext[]> {
        const configFiles = await fg(`**/${LUNAPRESS_DEFAULT_CONFIG_NAME}`, {
            cwd: source,
            absolute: true,
            ignore: ['**/node_modules/**'],
        })

        const results: ProjectContext[] = []

        for (const configPath of configFiles) {
            const projectRoot = path.dirname(configPath)

            const context = await this.resolveContext(projectRoot, configPath)
            if (context) {
                results.push(context)
            }
        }

        return results
    }

    private async resolveContext(root: string, configPath: string): Promise<ProjectContext | null> {
        const lunaPressConfig = await resolveLunaPressConfig({
            configPath,
            initializedJiti: this.jiti,
        })

        if (!lunaPressConfig?.i18n?.inputs?.length) {
            return null
        }

        const tsConfigPath = path.join(root, 'tsconfig.json')
        if (!fs.existsSync(tsConfigPath)) {
            return null
        }

        let viteConfigPath: string | undefined = undefined
        const customVitePath = lunaPressConfig.viteConfigPath

        if (customVitePath) {
            viteConfigPath = path.resolve(root, customVitePath)
        } else {
            const matches = await fg.async(['vite.config.{ts,js,mts}'], {
                cwd: root,
                absolute: true,
            })

            if (matches.length > 0) {
                viteConfigPath = matches[0]
            }
        }

        if (viteConfigPath === undefined || !fs.existsSync(viteConfigPath)) {
            return null
        }

        const viteConfig = await resolveConfig({ configFile: viteConfigPath }, 'build')

        return {
            name: path.basename(root),
            rootPath: root,
            tsConfigPath,
            viteConfigPath,
            viteConfig,
            lunaPressConfig,
        }
    }
}
