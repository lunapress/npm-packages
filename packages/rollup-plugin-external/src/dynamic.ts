/**
 * Default wrapper for dynamic imports
 * e.g. import('react') -> Promise.resolve(window.React)
 */
export const defaultDynamicWrapper = (id: string) => `Promise.resolve(${id})`