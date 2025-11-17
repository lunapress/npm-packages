/**
 * @param importedName 'default' | 'useState' | 'Another'
 * @param globalName 'window.React' | 'wp.element'
 */
export const makeGlobalName = (
	importedName: string,
	globalName: string,
): string => {
	if (importedName === 'default') {
		return globalName
	}

	return `${globalName}.${importedName}`
}
