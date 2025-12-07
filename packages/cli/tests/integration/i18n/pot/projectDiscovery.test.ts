import { describe, it, expect } from 'vitest'
import { ProjectDiscovery } from '@/cli/i18n/pot/projectDiscovery'
import { packageFixtureDataset } from '@/tests/fixture'
import path from 'node:path'
import fs from 'node:fs'

const cases = packageFixtureDataset('cli', 'i18n/pot/discovery')

describe('ProjectDiscovery', () => {
    it.each(cases)('Case: $name', async ({ path: fixturePath }) => {
        const projectDiscovery = new ProjectDiscovery()
        const projects = await projectDiscovery.scan(fixturePath)
        const expectedPath = path.join(fixturePath, 'expected.json')
        const expected =
            fs.existsSync(expectedPath) ? JSON.parse(fs.readFileSync(expectedPath, 'utf-8')) : []

        projects.forEach((project, i) => {
            const rel = expected[i]
            if (rel.rootPath) {
                expect(project.rootPath).toBe(path.join(fixturePath, rel.rootPath))
            }
            if (rel.tsConfigPath) {
                expect(project.tsConfigPath).toBe(path.join(fixturePath, rel.tsConfigPath))
            }
            if (rel.viteConfigPath) {
                expect(project.viteConfigPath).toBe(path.join(fixturePath, rel.viteConfigPath))
            }
        })

        const normalizedProjects = projects.map((project) => ({
            ...project,
            rootPath: path.relative(fixturePath, project.rootPath),
            tsConfigPath: path.relative(fixturePath, project.tsConfigPath),
            viteConfigPath: path.relative(fixturePath, project.viteConfigPath),
        }))

        expect(normalizedProjects).toHaveLength(expected.length)
        expect(normalizedProjects).toMatchObject(expected)
    })
})
