import { config } from 'dotenv'
import { expand } from 'dotenv-expand'

import { ZodError, z } from 'zod'

const stringBoolean = z.coerce
  .string()
  .transform((val) => {
    return val === 'true'
  })
  .default('false')

const EnvSchema = z.object({
  NODE_ENV: z.string().default('development'),
  PORT: z.coerce.number().default(7000),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('silent'),
  DATABASE_URL: z.string(),
  DATABASE_AUTH_TOKEN: z.string().optional(),
  // REDIS_URI: z.string(),
  S3_ACCESS_KEY: z.string().optional() || '',
  S3_BUCKET_NAME: z.string().optional() || '',
  S3_REGION: z.string().optional() || 'ap-south-1',
  S3_SECRET: z.string().optional() || '',
  PROJECT_NAME: z.string().default('TOWNSHIP'),
  DB_MIGRATING: stringBoolean.default('false'),
  DB_SEEDING: stringBoolean.default('false'),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  PHONEPE_MERCHANT_ACCOUNT: z.string().optional(),
  PHONEPE_MODE: z.string().default('prod').optional(),
  PHONEPE_SALT: z.string().optional(),
  TOKEN_SECRET: z.string().default('secret'),
  MSG91_API_KEY: z.string().optional(),
  HTTP_ENDPOINT: z.string().default('http://localhost:3000'),
  BREVO_API_KEY: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_URL: z.string().optional(),
  CLOUDINARY_UPLOAD_PRESET: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  SHIPROCKET_API_EMAIL: z.string().optional(),
  SHIPROCKET_API_PASSWORD: z.string().optional(),
  ARCJET_ENV: z.string().optional(),
  ARCJET_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional() || '',
  NIMBUS_API_EMAIL: z.string().optional() || '',
  NIMBUS_API_PASSWORD: z.string().optional() || '',
  PUBLIC_DOMAIN: z.string().optional() || 'misiki.in',
})
export type EnvSchema = z.infer<typeof EnvSchema>

expand(config())

try {
  EnvSchema.parse(process.env)
} catch (error) {
  if (error instanceof ZodError) {
    let message = 'Missing required values in .env:\n'
    error.issues.forEach((issue) => {
      message += issue.path[0] + '\n'
    })
    const e = new Error(message)
    e.stack = ''
    throw e
  } else {
    console.error(error)
  }
}

export default EnvSchema.parse(process.env)
