import { Flags, type Interfaces } from '@oclif/core'
import { BaseCommand, type FlagsCLI } from '../../baseCommand'

export default class MakePot extends BaseCommand<typeof MakePot> {
	static summary = 'child class that extends BaseCommand'

    aliases = ['make-pot']

	static examples = [
		'<%= config.bin %> <%= command.id %>',
		'<%= config.bin %> <%= command.id %> --json',
		'<%= config.bin %> <%= command.id %> --log-level debug',
	]

	static flags: Interfaces.FlagInput = {
		name: Flags.string({
			char: 'n',
			summary: 'Name to print.',
			required: true,
		}),
	}

	public async run(): Promise<string> {
        const {flags} = await this.parse(MakePot)
        console.log(flags)
        return 'яяяяя'
		for (const [flag, value] of Object.entries(this.flags)) {
			this.log(`${flag}: ${value}`)
		}

	}
}
