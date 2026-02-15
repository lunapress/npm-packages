import { build, InlineConfig } from 'vite'

export const preBuildViteProject = async (
    fixturePath: string,
    originalCwdPath: string,
    inlineConfig: InlineConfig | undefined = undefined,
): Promise<void> => {
    try {
        process.chdir(fixturePath)
        await build(inlineConfig)
    } finally {
        process.chdir(originalCwdPath)
    }
}