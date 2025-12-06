import path from 'node:path'
import fs from 'node:fs'

const MONOREPO_ROOT = path.resolve(__dirname, '../')

export const packageFixture = (packageName: string, fixturePath: string): string => {
    const targetPath = path.join(
        MONOREPO_ROOT,
        'packages',
        packageName,
        'tests',
        'fixture',
        fixturePath,
    )

    if (!fs.existsSync(targetPath)) {
        throw new Error(`The fixture file [${targetPath}] does not exist.`)
    }

    return targetPath
}

export const packageFixtureDataset = (packageName: string, fixturePath: string) => {
    const fixturesDir = packageFixture(packageName, fixturePath)

    const entries = fs.readdirSync(fixturesDir, { withFileTypes: true })

    return entries
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => ({
            name: dirent.name,
            path: path.join(fixturesDir, dirent.name),
        }))
}

export const cleanDir = (dirPath: string): void => {
    if (fs.existsSync(dirPath)) {
        fs.rmSync(dirPath, { recursive: true, force: true })
    }
    fs.mkdirSync(dirPath, { recursive: true })
}
