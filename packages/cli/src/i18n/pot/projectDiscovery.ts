import { Manifest, resolveConfig, ResolvedConfig as ViteUserConfig, Alias } from 'vite'
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
import { ResolverFactory } from 'oxc-resolver'
import { InputOption } from 'rollup'
import { ts } from 'ts-morph'

export interface ProjectContext {
    name: string
    rootPath: string
    tsConfigPath: string
    viteConfigPath: string
    viteManifestPath: string
    viteConfig: ViteUserConfig
    lunaPressConfig: LunaPressConfig
    viteManifest: Manifest
    entryPoints: string[]
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

        const tsConfigPath = ts.findConfigFile(root, ts.sys.fileExists)
        if (tsConfigPath === undefined) {
            return null
        }

        const customVitePath = lunaPressConfig.viteConfigPath
            ? path.resolve(root, lunaPressConfig.viteConfigPath)
            : undefined

        if (customVitePath && !fs.existsSync(customVitePath)) {
            return null
        }

        const viteConfig = await resolveConfig(
            {
                root,
                configFile: customVitePath,
            },
            'build',
        )

        if (!viteConfig.configFile) {
            return null
        }

        const viteConfigPath = viteConfig.configFile
        const viteManifestPath = this.getViteManifestPath(root, viteConfig)
        const viteManifest = await this.loadViteManifest(viteManifestPath)

        if (viteManifest === null) {
            return null
        }

        const entryPoints: string[] = []
        const inputList = this.normalizeInputPaths(viteConfig.build.rollupOptions.input)
        const resolver = new ResolverFactory({
            tsconfig: {
                configFile: tsConfigPath,
                references: 'auto',
            },
            alias: this.normalizeViteAlias(viteConfig.resolve.alias),
            extensions: viteConfig.resolve.extensions ?? ['.ts', '.tsx', '.js', '.jsx', '.json'],
            mainFields: viteConfig.resolve.mainFields,
            conditionNames: viteConfig.resolve.conditions,
        })

        for (const input of inputList) {
            const result = await resolver.resolveFileAsync(root, input)
            if (result.path) {
                entryPoints.push(result.path)
            }
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
            entryPoints,
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

    private normalizeViteAlias(viteAlias: Alias[]): Record<string, string[]> {
        const normalized: Record<string, string[]> = {}

        viteAlias.forEach(({ find, replacement }) => {
            const key = find instanceof RegExp ? find.source : find
            normalized[key] = [replacement]
        })

        return normalized
    }

    private normalizeInputPaths(rawInputs: InputOption | undefined): string[] {
        let inputList: string[] = []
        if (typeof rawInputs === 'string') {
            inputList = [rawInputs]
        } else if (Array.isArray(rawInputs)) {
            inputList = rawInputs
        } else if (rawInputs) {
            inputList = Object.values(rawInputs)
        }

        return inputList
    }
}