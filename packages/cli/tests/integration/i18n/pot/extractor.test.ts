import { Project } from 'ts-morph'
import { describe, it, expect } from 'vitest'
import { Extractor } from '@/cli/i18n/pot/extractor'
import { packageFixtureDataset } from '@/tests/fixture'
import path from 'node:path'
import fs from 'node:fs'
import { Packages } from '@/tests/packages'

const cases = packageFixtureDataset(Packages.CLI, 'i18n/pot/extractor')

describe(Extractor.name, () => {
    it.each(cases)('Case: $name', ({ path: fixturePath }) => {
        const project = new Project({
            tsConfigFilePath: path.join(fixturePath, 'tsconfig.json'),
        })

        const appFile = project.getSourceFileOrThrow(path.join(fixturePath, 'src/App.tsx'))
        const expectedPath = path.join(fixturePath, 'expected.json')
        const expected = JSON.parse(fs.readFileSync(expectedPath, 'utf-8'))

        const extractor = new Extractor()
        const result = extractor.extract({ sourceFile: appFile })

        expect(result).toMatchObject(expected)
    })
})
