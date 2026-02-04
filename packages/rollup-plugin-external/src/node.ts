import type { Node } from 'estree'

export const isNodeWithStartAndEnd = (
    node: Node,
): node is { start: number; end: number } & Node => {
    return (
        'start' in node &&
        'end' in node &&
        typeof node.start === 'number' &&
        typeof node.end === 'number'
    )
}