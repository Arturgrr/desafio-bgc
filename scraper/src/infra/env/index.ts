import "dotenv/config"
import { z } from "zod"

export const envSchema = z.object({
  AWS_REGION: z.string(),
  AWS_ACCESS_KEY_ID: z.string(),
  AWS_SECRET_ACCESS_KEY: z.string(),
  DYNAMO_ENDPOINT: z.string(),
  PRODUCTS_TABLE: z.string(),
})

const _env = envSchema.safeParse(process.env)

if (!_env.success) {
  throw new Error(`Invalid environment variables: ${_env.error.message}`)
}

export const env = _env.data;