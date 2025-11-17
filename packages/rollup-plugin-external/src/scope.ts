import type { AttachedScope } from '@rollup/pluginutils'
import type { Node } from 'estree'

export const hasScope = (
	node: Node,
): node is Node & { scope: AttachedScope } => {
	return 'scope' in node
}
