export default {
	indent: '    ',
	versionGroups: [
		{
			label: 'Peer dependencies',
			dependencyTypes: ['peer'],
			dependencies: ['**'],
			isIgnored: true,
		},
		{
			label: 'Использовать версии из корня как эталон',
			dependencies: ['**'],
			packages: ['**'],
			snapTo: ['@lunapress/npm-packages'],
		},
	],
} satisfies import('syncpack').RcFile
