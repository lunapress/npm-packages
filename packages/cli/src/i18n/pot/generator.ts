import { Project, SourceFile, ts } from 'ts-morph'
import path from 'node:path'
import { ProjectContext } from './projectDiscovery'
import { Extractor, TranslationEntry } from './extractor'

export interface AssetTranslations {
    assetPath: string
    entries: TranslationEntry[]
}

export interface ITranslationGenerator {
    generate(context: ProjectContext): AssetTranslations[]
}

export class TranslationGenerator implements ITranslationGenerator {
    constructor(
        private extractor: Extractor,
        private basePath: string,
    ) {}

    public generate(context: ProjectContext): AssetTranslations[] {
        const { rootPath, tsConfigPath, viteManifest, entryPoints } = context
        const configGroups = this.groupEntriesByConfig(tsConfigPath, entryPoints)

        return Array.from(configGroups.entries()).flatMap(([configPath, groupEntryPoints]) => {
            const project = new Project({
                tsConfigFilePath: configPath,
                skipAddingFilesFromTsConfig: false,
            })

            return groupEntryPoints
                .map((entryPoint) => {
                    const dependencyFiles = this.collectDependencies(project, entryPoint)
                    if (dependencyFiles.length === 0) return null

                    const entries = dependencyFiles.flatMap((sourceFile) =>
                        this.extractor.extract({ sourceFile }).map((entry) => ({
                            ...entry,
                            sourceFile: path
                                .relative(this.basePath, entry.sourceFile)
                                .replace(/\\/g, '/'),
                        })),
                    )

                    if (entries.length === 0) return null

                    const manifestKey = path.relative(rootPath, entryPoint)
                    const manifestItem = viteManifest[manifestKey]

                    if (manifestItem?.file === undefined) return null

                    const absoluteOutDir = path.resolve(rootPath, context.viteConfig.build.outDir)
                    const absoluteAssetPath = path.resolve(absoluteOutDir, manifestItem.file)
                    const assetPath = path
                        .relative(this.basePath, absoluteAssetPath)
                        .replace(/\\/g, '/')

                    return {
                        assetPath,
                        entries,
                    }
                })
                .filter((item): item is AssetTranslations => item !== null)
        })
    }

    private collectDependencies(project: Project, entryFilePath: string): SourceFile[] {
        const entryFile = project.addSourceFileAtPathIfExists(entryFilePath)
        if (!entryFile) return []

        project.resolveSourceFileDependencies()

        const visitedPaths = new Set<string>()
        const resultFiles: SourceFile[] = []

        const traverse = (file: SourceFile) => {
            const filePath = file.getFilePath()

            if (visitedPaths.has(filePath)) return
            if (file.isInNodeModules() || file.isDeclarationFile()) return

            visitedPaths.add(filePath)
            resultFiles.push(file)

            file.getReferencedSourceFiles().forEach((importedFile) => traverse(importedFile))
        }

        traverse(entryFile)

        return resultFiles
    }

    private groupEntriesByConfig(
        tsConfigPath: string,
        entryPoints: string[],
    ): Map<string, string[]> {
        const groups = new Map<string, string[]>()

        for (const entryPoint of entryPoints) {
            const config = this.findTsConfigForEntryPoint(tsConfigPath, entryPoint)
            const entries = groups.get(config) || []
            entries.push(entryPoint)
            groups.set(config, entries)
        }

        return groups
    }

    private findTsConfigForEntryPoint(tsConfigPath: string, entryPoint: string): string {
        const host: ts.ParseConfigFileHost = {
            ...ts.sys,
            onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
                console.error(
                    ts.formatDiagnostic(diagnostic, {
                        getNewLine: () => ts.sys.newLine,
                        getCanonicalFileName(fileName: string): string {
                            return ts.sys.useCaseSensitiveFileNames
                                ? fileName
                                : fileName.toLowerCase()
                        },
                        getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
                    }),
                )
            },
        }
        const parsed = ts.getParsedCommandLineOfConfigFile(tsConfigPath, {}, host)

        if (parsed?.fileNames.length !== 0) return tsConfigPath

        if (parsed?.projectReferences) {
            for (const ref of parsed.projectReferences) {
                const refConfigPath = ts.resolveProjectReferencePath(ref)
                const subParsed = ts.getParsedCommandLineOfConfigFile(
                    refConfigPath,
                    undefined,
                    host,
                )

                if (
                    subParsed?.fileNames.some((f) => path.resolve(f) === path.resolve(entryPoint))
                ) {
                    return refConfigPath
                }
            }
        }

        return tsConfigPath
    }
}