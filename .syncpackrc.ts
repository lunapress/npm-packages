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
            label: 'Use versions from the root',
            dependencies: ['**'],
            packages: ['**'],
            snapTo: ['@lunapress/npm-packages'],
        },
    ],
} satisfies import('syncpack').RcFile