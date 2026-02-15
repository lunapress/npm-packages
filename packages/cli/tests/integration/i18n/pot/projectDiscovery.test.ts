import { describe, it, expect } from 'vitest'
import { build } from 'vite'
import { ProjectContext, ProjectDiscovery } from '@/cli/i18n/pot/projectDiscovery'
import { packageFixtureDataset } from '@/tests/fixture'
import path from 'node:path'
import fs from 'node:fs'
import { preBuildViteProject } from '@/tests/vite'

const viteConfig: Record<string, string> = {
    'custom-vite': 'vite.ts',
}

const cases = packageFixtureDataset('cli', 'i18n/pot/discovery')

describe(ProjectDiscovery.name, () => {
    it.each(cases)('Case: $name', async ({ path: fixturePath, name }) => {
        await preBuildViteProject(fixturePath, process.cwd(), {
            root: fixturePath,
            configFile:
                name in viteConfig ? path.join(fixturePath, viteConfig[name] ?? '') : undefined,
        })

        const projectDiscovery = new ProjectDiscovery()
        const projects = await projectDiscovery.scan(fixturePath)
        const expectedPath = path.join(fixturePath, 'expected.json')
        const expected = (
            fs.existsSync(expectedPath) ? JSON.parse(fs.readFileSync(expectedPath, 'utf-8')) : []
        ) as ProjectContext[]

        const normalizedProjects = projects.map((project) => ({
            ...project,
            rootPath: path.relative(fixturePath, project.rootPath),
            tsConfigPath: path.relative(fixturePath, project.tsConfigPath),
            viteConfigPath: path.relative(fixturePath, project.viteConfigPath),
            viteManifestPath: path.relative(fixturePath, project.viteManifestPath),
            entryPoints: project.entryPoints.map((entryPoint) =>
                path.relative(fixturePath, entryPoint),
            ),
        }))

        expect(normalizedProjects).toHaveLength(expected.length)
        expect(normalizedProjects).toMatchObject(expected)
    })
})