import lunapressExternal from '@lunapress/rollup-plugin-external'
import type { Plugin } from 'rollup'

export default function lunapressWordPress(): Plugin {
	const external = lunapressExternal({
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
	}
}
