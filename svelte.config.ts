import { mdsvex } from 'mdsvex'
import adapter from '@sveltejs/adapter-auto'
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte'

const config = {
  preprocess: [vitePreprocess(), mdsvex()],
  kit: {
    adapter: adapter(),
    alias: {
      '@/*': './src/*',
    },
  },
  vitePlugin: {
    inspector: true,
  },
  compilerOptions: {
    runes: true,
    enableSourcemap: true,
  },
  extensions: ['.svelte', '.svx'],
}

export default config
