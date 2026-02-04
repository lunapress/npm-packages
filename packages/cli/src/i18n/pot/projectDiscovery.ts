import { Manifest, resolveConfig, ResolvedConfig as ViteUserConfig } from 'vite'
import {
    LUNAPRESS_DEFAULT_CONFIG_NAME,
    type LunaPressConfig,
    resolveLunaPressConfig,
} from '@lunapress/config'
import fg from 'fast-glob'
import fs from 'node:fs'
import path from 'node:path'
import { createJiti } from 'jiti'
import { z } from 'zod'

export interface ProjectContext {
    name: string
    rootPath: string
    tsConfigPath: string
    viteConfigPath: string
    viteManifestPath: string
    viteConfig: ViteUserConfig
    lunaPressConfig: LunaPressConfig
    viteManifest: Manifest
}

export interface IProjectDiscovery {
    scan(source: string): Promise<ProjectContext[]>
}

export const manifestChunkSchema = z.object({
    src: z.string().optional(),
    file: z.string(),
    css: z.array(z.string()).optional(),
    assets: z.array(z.string()).optional(),
    isEntry: z.boolean().optional(),
    name: z.string().optional(),
    isDynamicEntry: z.boolean().optional(),
    imports: z.array(z.string()).optional(),
    dynamicImports: z.array(z.string()).optional(),
})

export const manifestSchema = z.record(z.string(), manifestChunkSchema)

export class ProjectDiscovery implements IProjectDiscovery {
    private jiti = createJiti(import.meta.url)

    public async scan(source: string): Promise<ProjectContext[]> {
        const configFiles = await fg(`**/${LUNAPRESS_DEFAULT_CONFIG_NAME}`, {
            cwd: source,
            absolute: true,
            ignore: ['**/node_modules/**', '**/vendor/**', '**/.pnpm-store/**'],
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
        if (lunaPressConfig === null) {
            return null
        }

        const tsConfigPath = path.join(root, 'tsconfig.json')
        if (!fs.existsSync(tsConfigPath)) {
            return null
        }

        let viteConfigPath: string | undefined = undefined
        const customVitePath = lunaPressConfig.viteConfigPath

        if (customVitePath !== undefined) {
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
        const viteManifestPath = this.getViteManifestPath(root, viteConfig)
        const viteManifest = await this.loadViteManifest(viteManifestPath)

        if (viteManifest === null) {
            return null
        }

        return {
            name: path.basename(root),
            rootPath: root,
            tsConfigPath,
            viteConfigPath,
            viteManifestPath,
            viteConfig,
            lunaPressConfig,
            viteManifest,
        }
    }

    private getViteManifestPath(root: string, viteConfig: ViteUserConfig): string {
        const buildPath = path.join(root, viteConfig.build.outDir)
        const manifestPath =
            typeof viteConfig.build.manifest === 'string'
                ? viteConfig.build.manifest
                : '.vite/manifest.json'

        return path.resolve(root, buildPath, manifestPath)
    }

    private async loadViteManifest(viteManifestPath: string): Promise<Manifest | null> {
        if (!fs.existsSync(viteManifestPath)) {
            return null
        }

        try {
            const content = await fs.promises.readFile(viteManifestPath, 'utf-8')
            const rawData = JSON.parse(content)
            return manifestSchema.parse(rawData)
        } catch (error) {
            return null
        }
    }
}