import { Project } from 'ts-morph'
import { describe, it, expect } from 'vitest'
import { Extractor } from '@/cli/i18n/pot/extractor'
import { loadFixtureOptions, packageFixtureDataset } from '@/tests/fixture'
import path from 'node:path'
import fs from 'node:fs'
import { Packages } from '@/tests/packages'
import { z } from 'zod'

const OptionsSchema = z.object({
    domains: z.array(z.string()).optional().default([]),
    ignoreDomains: z.array(z.string()).optional().default([]),
})

const cases = packageFixtureDataset(Packages.CLI, 'i18n/pot/extractor')

describe(Extractor.name, () => {
    it.each(cases)('Case: $name', ({ path: fixturePath }) => {
        const project = new Project({
            tsConfigFilePath: path.join(fixturePath, 'tsconfig.json'),
        })

        const appFile = project.getSourceFileOrThrow(path.join(fixturePath, 'src/App.tsx'))
        const expectedPath = path.join(fixturePath, 'expected.json')
        const expected = JSON.parse(fs.readFileSync(expectedPath, 'utf-8'))
        const { domains, ignoreDomains } = loadFixtureOptions(fixturePath, OptionsSchema)

        const extractor = new Extractor(domains, ignoreDomains)
        const rawResult = extractor.extract({ sourceFile: appFile })

        const result = rawResult.map((entry) => ({
            ...entry,
            sourceFile: path.relative(fixturePath, entry.sourceFile).replace(/\\/g, '/'),
        }))

        expect(result).toMatchObject(expected)
    })
})