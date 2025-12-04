import { readFileSync, writeFileSync } from 'node:fs'
import { globSync } from 'glob'

const workpaces = globSync(['packages/*/package.json'], {
    ignore: ['**/node_modules/**'],
    absolute: true,
})

const versions = new Map()
workpaces.forEach((path) => {
    const pkg = JSON.parse(readFileSync(path, 'utf-8'))
    versions.set(pkg.name, pkg.version)
})

const replaceDeps = (deps: Record<string, string> | undefined) => {
    if (!deps) return
    for (const [name, version] of Object.entries(deps)) {
        if (version.startsWith('workspace:')) {
            const realVersion = versions.get(name)
            if (realVersion) {
                deps[name] = realVersion
                console.log(`Replaced ${name}: ${version} -> ${realVersion}`)
            }
        }
    }
}

workpaces.forEach((path) => {
    const pkg = JSON.parse(readFileSync(path, 'utf-8'))
    let changed = false

    ;['dependencies', 'devDependencies', 'peerDependencies'].forEach((type) => {
        if (pkg[type]) {
            replaceDeps(pkg[type])
            changed = true
        }
    })

    if (changed) {
        writeFileSync(path, JSON.stringify(pkg, null, 4) + '\n')
    }
})

console.log('✅ Workspace protocols removed for publishing')
