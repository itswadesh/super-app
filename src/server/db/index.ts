import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { CONFIG } from '../config/index'
// Import schema from SvelteKit source to ensure consistency
import * as schema from './schema'

// Get database configuration from config file
const url = CONFIG?.db?.url || process.env.DATABASE_URL || 'postgresql://localhost:5432/misiki'

// Create client
export const connection = postgres(url)

export const db = drizzle(connection, { schema }) // , logger: true })

export type db = typeof db

export default db
