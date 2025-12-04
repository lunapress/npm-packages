import { Command, type Interfaces, Flags as OclifFlags } from '@oclif/core'

export type FlagsCLI<T extends typeof Command> = Interfaces.InferredFlags<
	(typeof BaseCommand)['baseFlags'] & T['flags']
>
export type ArgsCLI<T extends typeof Command> = Interfaces.InferredArgs<T['args']>

export abstract class BaseCommand<T extends typeof Command> extends Command {
	static enableJsonFlag = true

	static baseFlags = {
		'log-level': OclifFlags.option({
			default: 'info',
			helpGroup: 'GLOBAL',
			options: ['debug', 'warn', 'error', 'info', 'trace'] as const,
			summary: 'Specify level for logging.',
		})(),
	}

	protected flags!: FlagsCLI<T>
	protected args!: ArgsCLI<T>

	public async init(): Promise<void> {
		await super.init()
		const { args, flags } = await this.parse({
			flags: this.ctor.flags,
			baseFlags: (super.ctor as typeof BaseCommand).baseFlags,
			enableJsonFlag: this.ctor.enableJsonFlag,
			args: this.ctor.args,
			strict: this.ctor.strict,
		})
		this.flags = flags as FlagsCLI<T>
		this.args = args as ArgsCLI<T>
	}

	protected async catch(err: Error & { exitCode?: number }): Promise<any> {
		// add any custom logic to handle errors from the command
		// or simply return the parent class error handling
		return super.catch(err)
	}

	protected async finally(_: Error | undefined): Promise<any> {
		// called after run and catch regardless of whether or not the command errored
		return super.finally(_)
	}
}
