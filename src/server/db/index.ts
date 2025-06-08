import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { CONFIG } from '../config/index'
// Import schema from SvelteKit source to ensure consistency
import * as schema from './schema'

// Get database configuration from config file
const url = CONFIG?.db?.url || 'file:./local.db'
const authToken = CONFIG?.db?.authToken

const options = authToken ? { authToken } : {}

// Create client
export const connection = createClient({ url, ...options })

export const db = drizzle(connection, { schema }) // , logger: true })

export type db = typeof db

export default db
