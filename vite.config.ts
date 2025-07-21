import tailwindcss from '@tailwindcss/vite'
import { sveltekit } from '@sveltejs/kit/vite'
import { defineConfig } from 'vite'
import devtoolsJson from 'vite-plugin-devtools-json'

export default defineConfig({
  plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
  preview: {
    allowedHosts: ['metrics.litekart.in'],
  },
  server: {
    allowedHosts: true, // This is required, else will "throw Blocked request. This host ("shopnx.in") is not allowed."
    host: true,
    // proxy: {
    //   '/api': {
    //     target: 'https://api.sparkinity.com', // Backend server URL
    //     changeOrigin: true, // Required for CORS
    //     secure: false, // Disable SSL verification if needed
    //     rewrite: (path) => path.replace(/^\/api/, 'api'), // Remove `/api` prefix
    //   },
    // },
  },
})
