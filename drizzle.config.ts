import { defineConfig } from 'drizzle-kit'
import env from './src/server/env'

export default defineConfig({
  schema: './src/server/db/schema.ts',
  dbCredentials: {
    url: env.DATABASE_URL,
  },
  verbose: true,
  strict: true,
  dialect: 'postgresql',
})
