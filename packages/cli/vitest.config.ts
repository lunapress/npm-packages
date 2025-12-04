import { defineConfig } from 'vitest/config'

export default defineConfig({
	test: {
		globals: true,
		environment: 'node', // или 'jsdom', если это фронт
	},
})
