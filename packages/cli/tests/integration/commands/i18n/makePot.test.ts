import { captureOutput, runCommand } from '@oclif/test'
import { describe, expect, it } from 'vitest'
import * as path from 'node:path'
import { packageFixtureDataset } from '@/tests/fixture'
import { Packages } from '@/tests/packages'
import { preBuildViteProject } from '@/tests/vite'
import { Output } from '@/cli/commands/i18n/makePot'

const root = path.resolve(__dirname, '../../../../')
const cases = packageFixtureDataset(Packages.CLI, 'i18n/pot/generator')

describe('i18n:make-pot', () => {
    it('should return empty array if no projects found', async () => {
        const { result, error } = await runCommand(['i18n:makePot', '/tmp/empty-dir'], {
            root,
        })

        expect(error).toBeUndefined()
        expect(result).toEqual([])
    })

    it.each(cases)('Integration Case: $name', async ({ path: fixturePath }) => {
        await preBuildViteProject(fixturePath, process.cwd())

        const { result, error } = await runCommand(['i18n:makePot', fixturePath], {
            root,
        })

        expect(error).toBeUndefined()

        const output = result as Output
        expect(output).toBeDefined()
        expect(output.length).toBeGreaterThan(0)

        expect(output[0]).toMatchObject({
            project: expect.any(String),
            path: expect.any(String),
            files: expect.any(Array),
        })
    })
})