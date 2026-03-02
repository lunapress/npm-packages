import { Args, Flags, type Interfaces } from '@oclif/core'
import { BaseCommand } from '@/cli/baseCommand'
import { Extractor } from '@/cli/i18n/pot/extractor'
import { ProjectDiscovery } from '@/cli/i18n/pot/projectDiscovery'
import { ChunkTranslation, TranslationGenerator } from '@/cli/i18n/pot/generator'

interface OutputItem {
    project: string
    path: string
    files: ChunkTranslation[]
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
    }

    public async run(): Promise<Output> {
        const domains = this.flags.domains || []
        const ignoreDomains = this.flags.ignoreDomains || []

        const discovery = new ProjectDiscovery()
        const projects = await discovery.scan(this.args.source)

        const extractor = new Extractor(domains, ignoreDomains)
        const generator = new TranslationGenerator(extractor)
        const output: Output = []

        for (const project of projects) {
            const chunks = generator.generate(project)

            output.push({
                project: project.name,
                path: project.rootPath,
                files: chunks,
            })
        }

        return output
    }
}