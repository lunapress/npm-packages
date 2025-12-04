import { Args, Flags, type Interfaces } from '@oclif/core'
import { ArgsCLI, BaseCommand, type FlagsCLI } from '../../baseCommand'

export default class I18nMakePot extends BaseCommand<typeof I18nMakePot> {
	static summary = 'Generating JSON translations for .pot'

    static args = {
        source: Args.string({
            required: true,
            default: '.'
        })
    }

	static flags: Interfaces.FlagInput = {
        domains: Flags.string({
            summary: 'Consider only specific domains',
            required: false
        }),
		ignoreDomains: Flags.string({
			summary: 'Ignore domains',
            required: false
		}),
	}

	public async run(): Promise<[]> {
        console.log(this.args)
        console.log(this.flags)
        return []
	}
}
