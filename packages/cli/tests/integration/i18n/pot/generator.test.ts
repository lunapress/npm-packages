import { packageFixtureDataset } from '@/tests/fixture'
import { Packages } from '@/tests/packages'
import { describe, expect, it } from 'vitest'
import path from 'node:path'
import fs from 'node:fs'
import { TranslationGenerator } from '@/cli/i18n/pot/generator'
import { Extractor } from '@/cli/i18n/pot/extractor'
import { ProjectDiscovery } from '@/cli/i18n/pot/projectDiscovery'
import { preBuildViteProject } from '@/tests/vite'

const cases = packageFixtureDataset(Packages.CLI, 'i18n/pot/generator')

describe(TranslationGenerator.name, () => {
    it.each(cases)('Case: $name', async ({ path: fixturePath, name }) => {
        await preBuildViteProject(fixturePath, process.cwd())

        const discovery = new ProjectDiscovery()
        const extractor = new Extractor()
        const generator = new TranslationGenerator(extractor)

        const projects = await discovery.scan(fixturePath)
        expect(projects).toHaveLength(1)

        const result = generator.generate(projects[0]!)

        const expectedPath = path.join(fixturePath, 'expected.json')
        const expected = JSON.parse(fs.readFileSync(expectedPath, 'utf-8'))

        expect(result).toMatchObject(expected)
    })
})