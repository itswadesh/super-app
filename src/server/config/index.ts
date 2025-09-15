/**
 * Misiki API Server Configuration
 *
 * This file contains environment-specific configuration for the Hono API server.
 */

import env from '../env'

// import { config } from 'dotenv';
// import process from 'node:process';

// Load environment variables from .env file
// config();

export const CONFIG = {
  // Server settings
  server: {
    port: 3000,
    host: '0.0.0.0',
  },

  // Database settings
  db: {
    url: env.DATABASE_URL || 'file:./local.db',
    authToken: env.DATABASE_AUTH_TOKEN,
  },

  // CORS settings
  cors: {
    origin:
      env.NODE_ENV === 'production'
        ? ['https://misiki.in']
        : ['http://localhost:5173', 'http://localhost:4173'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },

  // Application info
  app: {
    name: 'Misiki API',
    version: '2.0.0',
  },
  sessionCookieName: 'auth-session',
  DAY_IN_MS: 1000 * 60 * 60 * 24,
  PAGE_SIZE: 20,
}
