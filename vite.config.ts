import tailwindcss from '@tailwindcss/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import devtoolsJson from 'vite-plugin-devtools-json'

export default defineConfig({
  plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
  preview: {
    allowedHosts: [
      'metrics.litekart.in',
      'misiki-litekartmetrics-aerecd-0ced29-69-62-81-230.traefik.me',
      'misiki.in',
    ],
  },
})
