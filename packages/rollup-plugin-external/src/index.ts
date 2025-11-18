import { attachScopes, createFilter } from '@rollup/pluginutils'
import type { Node, Program } from 'estree'
import { walk } from 'estree-walker'
import isReference from 'is-reference'
import MagicString from 'magic-string'
import type { Plugin } from 'rollup'
import { PLUGIN_NAME } from './const'
import { defaultDynamicWrapper } from './dynamic'
import { makeGlobalName } from './global'
import { hasScope } from './scope'

export interface LunaPressExternalOptions {
	/**
	 * e.g. { 'react': 'window.React' }
	 */
	globals: Record<string, string>
	/**
	 * Files to be processed
	 * @default '.*' (все файлы)
	 */
	include?: string | RegExp | (string | RegExp)[]
	/**
	 * Files to skip
	 */
	exclude?: string | RegExp | (string | RegExp)[]
	/**
	 * (Optional) Custom wrapper for dynamic imports
	 */
	dynamicWrapper?: (globalName: string) => string
}

export default function lunaPressExternal(
	options: LunaPressExternalOptions,
): Plugin {
	const {
		globals,
		include,
		exclude,
		dynamicWrapper = defaultDynamicWrapper,
	} = options

	if (!globals || Object.keys(globals).length === 0) {
		throw new Error(`[${PLUGIN_NAME}] The "globals" option is required.`)
	}

	const filter = createFilter(include, exclude)

	const getGlobalName = (source: string) => globals[source]

	return {
		name: PLUGIN_NAME,

		resolveId(source) {
			if (globals[source]) {
				return false
			}
			return null
		},

		async transform(code, id) {
			if (!filter(id)) {
				return null
			}

			const importsToFind = Object.keys(globals)
			if (!importsToFind.some((imp) => code.includes(imp))) {
				return null
			}

			let ast: Program
			try {
				ast = this.parse(code)
			} catch {
				this.warn(`[${PLUGIN_NAME}] Failed to parse ${id}, skipping.`)
				return null
			}

			const magicString = new MagicString(code)
			let isTouched = false

			// e.g. Map< 'React' -> 'window.React' >
			// e.g. Map< 'useState' -> 'window.React.useState' >
			const bindings = new Map<string, string>()

			for (const node of ast.body) {
				if (
					node.type !== 'ImportDeclaration' ||
					typeof node.source.value !== 'string' ||
					node.range === undefined
				) {
					continue
				}

				const globalName = getGlobalName(node.source.value)
				if (globalName === undefined) continue

				for (const spec of node.specifiers) {
					let global: string | undefined

					if (spec.type === 'ImportSpecifier') {
						// e.g. import { useState, useEffect } from 'react'
						const importedName =
							spec.imported.type === 'Identifier'
								? spec.imported.name
								: spec.imported.value

						if (typeof importedName === 'string') {
							global = makeGlobalName(importedName, globalName)
						}
					} else if (spec.type === 'ImportDefaultSpecifier') {
						// e.g. import React from 'react'
						global = makeGlobalName('default', globalName)
					} else {
						// e.g. import * as React from 'react'
						global = globalName
					}

					if (global !== undefined) {
						bindings.set(spec.local.name, global)
					}
				}

				magicString.remove(...node.range)
				isTouched = true
			}

			if (!isTouched) {
				return null
			}

			let scope = attachScopes(ast, 'scope')

			walk(ast, {
				enter(this, node: Node, parent: Node | null) {
					if (hasScope(node)) {
						scope = node.scope
					}

					const { range } = node

					if (range === undefined) {
						this.skip()
						return
					}

					if (
						node.type === 'ImportDeclaration' &&
						typeof node.source.value === 'string' &&
						getGlobalName(node.source.value)
					) {
						this.skip()
						return
					}

					let dynamicImportSource: string | null = null
					if (
						node.type === 'ImportExpression' &&
						node.source.type === 'Literal' &&
						typeof node.source.value === 'string'
					) {
						dynamicImportSource = node.source.value
					}

					const dynamicGlobal = dynamicImportSource
						? getGlobalName(dynamicImportSource)
						: null

					if (dynamicGlobal) {
						magicString.overwrite(
							...range,
							dynamicWrapper(dynamicGlobal),
						)
						isTouched = true
						this.skip()
						return
					}

					if (
						parent !== null &&
						isReference(node, parent) &&
						node.type === 'Identifier'
					) {
						const { name } = node

						if (bindings.has(name) && !scope.contains(name)) {
							const global = bindings.get(name)
							if (global !== undefined) {
								magicString.overwrite(...range, global, {
									contentOnly: true,
								})
								isTouched = true
							}
						}
					}
				},
				leave(node: Node) {
					if (hasScope(node) && scope.parent !== undefined) {
						scope = scope.parent
					}
				},
			})

			return {
				code: magicString.toString(),
				map: magicString.generateMap({ hires: true }),
			}
		},
	}
}
