import { Args, Flags, type Interfaces } from '@oclif/core'
import { BaseCommand } from '@/cli/baseCommand'
import { Extractor } from '@/cli/i18n/pot/extractor'
import { ProjectDiscovery } from '@/cli/i18n/pot/projectDiscovery'
import { AssetTranslations, TranslationGenerator } from '@/cli/i18n/pot/generator'
import path from 'node:path'

interface OutputItem {
    project: string
    path: string
    assets: AssetTranslations[]
}
export type Output = OutputItem[]

export default class I18nMakePot extends BaseCommand<typeof I18nMakePot> {
    static summary = 'Generating JSON translations for .pot'

    static args = {
        source: Args.string({
            required: true,
            default: '.',
        }),
    }

    static flags = {
        domains: Flags.string({
            summary: 'Consider only specific domains',
            multiple: true,
        }),
        ignoreDomains: Flags.string({
            summary: 'Ignore domains',
            multiple: true,
        }),
        base: Flags.string({
            summary: 'Base directory for resolving relative paths in the output',
            default: process.cwd(),
        }),
    }

    public async run(): Promise<Output> {
        const domains = this.flags.domains || []
        const ignoreDomains = this.flags.ignoreDomains || []
        const basePath = path.resolve(this.flags.base)

        const discovery = new ProjectDiscovery()
        const projects = await discovery.scan(this.args.source)

        const extractor = new Extractor(domains, ignoreDomains)
        const generator = new TranslationGenerator(extractor, basePath)
        const output: Output = []

        for (const project of projects) {
            const assets = generator.generate(project)

            output.push({
                project: project.name,
                path: project.rootPath,
                assets,
            })
        }

        return output
    }
}