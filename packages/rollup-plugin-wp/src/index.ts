import { fileURLToPath } from 'node:url'
import lunaPressExternal from '@lunapress/rollup-plugin-external'
import type { Plugin } from 'vite'

const shim = (path: string) =>
	fileURLToPath(new URL(`./shims/${path}`, import.meta.url))

export default function lunaPressWordPress(): Plugin {
	const external = lunaPressExternal({
		globals: {
			jquery: 'window.jQuery',
			'lodash-es': 'window.lodash',
			lodash: 'window.lodash',
			moment: 'window.moment',
			'react-dom': 'window.ReactDOM',
			react: 'window.React',

			'@wordpress/hooks': 'wp.hooks',
			'@wordpress/element': 'wp.element',
			'@wordpress/blocks': 'wp.blocks',
			'@wordpress/data': 'wp.data',
			'@wordpress/api-fetch': 'wp.apiFetch',
			'@wordpress/components': 'wp.components',
			'@wordpress/warning': 'wp.warning',
			'@wordpress/compose': 'wp.compose',
			'@wordpress/i18n': 'wp.i18n',
		},
	})

	return {
		...external,
		name: 'lunapress-wp',

		config: () => ({
			resolve: {
				alias: [
					{
						find: 'react/jsx-dev-runtime',
						replacement: shim('react-jsx-runtime-shim.ts'),
					},
					{
						find: 'react/jsx-runtime',
						replacement: shim('react-jsx-runtime-shim.ts'),
					},
					{
						find: 'react-dom/client',
						replacement: shim('react-dom-client-shim.ts'),
					},
					{
						find: 'react-dom',
						replacement: shim('react-dom-shim.ts'),
					},
				],
			},
			optimizeDeps: {
				exclude: ['react', 'react-dom'],
			},
			define: {
				$: 'window.jQuery',
			},
			server: {
				cors: true,
			},
		}),
	}
}
