import { defineConfig } from 'drizzle-kit';
import env from './src/server/env';

// Safe configuration for both server and client environments
const getDatabaseUrl = () => {
    // Only access process.env in a Node.js environment
    if (typeof process !== 'undefined' && process.env && process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }
    // Fallback to environment from our safe env module
    return env.DATABASE_URL || 'file:./local.db';
};

const getAuthToken = () => {
    const dbUrl = getDatabaseUrl();
    
    // Only use authToken for Turso remote databases
    if (dbUrl.includes('turso.io')) {
        // Try to get from process.env first if available
        if (typeof process !== 'undefined' && process.env && process.env.DATABASE_AUTH_TOKEN) {
            return process.env.DATABASE_AUTH_TOKEN;
        }
        // Fallback to our safe env module
        return env.DATABASE_AUTH_TOKEN;
    }
    
    return undefined;
};

const getDialect = () => {
    const dbUrl = getDatabaseUrl();
    return dbUrl.startsWith('file:') ? 'sqlite' : 'turso';
};

export default defineConfig({
    schema: './src/server/db/schema.ts',
    dbCredentials: {
        url: getDatabaseUrl(),
        authToken: getAuthToken()
    },
    verbose: true,
    strict: true,
    dialect: getDialect()
});
