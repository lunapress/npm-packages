import { SourceFile, Node, type CallExpression } from 'ts-morph'
import { isNumber, isString } from 'radash'

interface HasContext {
    context: string
}

interface HasPlural {
    single: string
    plural: string
    number: number
}

interface HasText {
    text: string
}

interface HasDomain {
    domain: string
}

interface Translation extends HasText, HasDomain {}
interface ContextTranslation extends Translation, HasContext {}
interface PluralTranslation extends HasPlural, HasDomain {}
interface ContextPluralTranslation extends PluralTranslation, HasContext {}

export type TranslationEntry =
    | Translation
    | PluralTranslation
    | ContextTranslation
    | ContextPluralTranslation

type ExtractParams = {
    sourceFile: SourceFile
}

interface IExtractor {
    extract(params: ExtractParams): TranslationEntry[]
}

export class Extractor implements IExtractor {
    private readonly handlers: Record<string, (node: CallExpression) => TranslationEntry | null>

    constructor() {
        this.handlers = {
            __: this.extractBasic.bind(this),

            _x: this.extractContext.bind(this),

            _n: this.extractPlural.bind(this),

            _nx: this.extractContextPlural.bind(this),
        }
    }

    public extract({ sourceFile }: ExtractParams): TranslationEntry[] {
        const translations: TranslationEntry[] = []

        sourceFile.forEachDescendant((node) => {
            if (!Node.isCallExpression(node)) return

            const expression = node.getExpression()
            const functionName = expression.getText()

            const handler = this.handlers[functionName]
            if (handler) {
                const result = handler(node)
                if (result) {
                    translations.push(result)
                }
            }
        })

        return translations
    }

    private extractBasic(node: CallExpression): Translation | null {
        const text = this.resolveStringArg(node, 0)
        const domain = this.resolveStringArg(node, 1)

        if (!text || !domain) return null

        return { text, domain }
    }

    private extractContext(node: CallExpression): ContextTranslation | null {
        const text = this.resolveStringArg(node, 0)
        const context = this.resolveStringArg(node, 1)
        const domain = this.resolveStringArg(node, 2)

        if (!text || !context || !domain) return null

        return { text, context, domain }
    }

    private extractPlural(node: CallExpression): PluralTranslation | null {
        const single = this.resolveStringArg(node, 0)
        const plural = this.resolveStringArg(node, 1)
        const numberVal = this.resolveNumberArg(node, 2)
        const domain = this.resolveStringArg(node, 3)

        if (!single || !plural || !domain || numberVal === null) return null

        return { single, plural, number: numberVal, domain }
    }

    private extractContextPlural(node: CallExpression): ContextPluralTranslation | null {
        const single = this.resolveStringArg(node, 0)
        const plural = this.resolveStringArg(node, 1)
        const numberValue = this.resolveNumberArg(node, 2)
        const context = this.resolveStringArg(node, 3)
        const domain = this.resolveStringArg(node, 4)

        if (!single || !plural || !context || !domain || numberValue === null) return null

        return { single, plural, number: numberValue, context, domain }
    }

    private resolveStringArg(node: CallExpression, index: number): string | null {
        const args = node.getArguments()
        if (!args[index]) return null

        const value = this.resolveValue(args[index])
        return isString(value) ? value : null
    }

    private resolveNumberArg(node: CallExpression, index: number): number | null {
        const args = node.getArguments()
        if (!args[index]) return null

        const value = this.resolveValue(args[index])
        return isNumber(value) ? value : null
    }

    private resolveValue(node: Node): string | number | null {
        if (
            Node.isStringLiteral(node) ||
            Node.isNoSubstitutionTemplateLiteral(node) ||
            Node.isNumericLiteral(node)
        ) {
            return node.getLiteralValue()
        }

        if (Node.isIdentifier(node)) {
            const definitions = node.getDefinitions()

            for (const def of definitions) {
                const declaration = def.getDeclarationNode()
                if (!declaration) continue

                // import { FOO } from './bar'
                if (Node.isImportSpecifier(declaration)) {
                    const importDecl = declaration.getImportDeclaration()
                    const moduleSpecifier = importDecl.getModuleSpecifierSourceFile()

                    if (moduleSpecifier) {
                        const exportedVar = moduleSpecifier.getVariableDeclaration(
                            declaration.getName(),
                        )
                        if (exportedVar) {
                            const initializer = exportedVar.getInitializer()
                            if (initializer) {
                                return this.resolveValue(initializer)
                            }
                        }
                    }
                    continue
                }

                // const FOO = 'bar'
                if (Node.isVariableDeclaration(declaration)) {
                    const initializer = declaration.getInitializer()
                    if (initializer) {
                        return this.resolveValue(initializer)
                    }
                }
            }
        }

        return null
    }
}