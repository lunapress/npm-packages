import { captureOutput, runCommand } from '@oclif/test'
import { describe, expect, it } from 'vitest'
import * as path from 'node:path'

const root = path.resolve(__dirname, '../../../../')

describe('i18n:make-pot', () => {
    it('runs by default', async () => {
        const { result, error } = await runCommand(['i18n:makePot'], {
            root,
        })
        expect(error).toBeUndefined()
        expect(result).toEqual([])
    })
})
