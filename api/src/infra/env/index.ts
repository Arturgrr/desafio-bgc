import "dotenv/config"
import { z } from "zod"

const envSchema = z.object({
  AWS_REGION: z.string().default("sa-east-1"),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  DYNAMO_ENDPOINT: z.string().optional(),
  PRODUCTS_TABLE: z.string(),
  IS_OFFLINE: z.union([z.boolean(), z.string()]).transform((value) => value === true || value === "true"),
})

const parsedEnv = envSchema.safeParse(process.env)

if (!parsedEnv.success) {
  throw new Error(`Invalid environment variables: ${parsedEnv.error.message}`)
}

const baseEnv = parsedEnv.data

export const env = {
  ...baseEnv,
  DYNAMO_ENDPOINT: baseEnv.DYNAMO_ENDPOINT ?? (baseEnv.IS_OFFLINE ? "http://localhost:8000" : undefined),
  AWS_ACCESS_KEY_ID: baseEnv.AWS_ACCESS_KEY_ID ?? (baseEnv.IS_OFFLINE ? "local" : undefined),
  AWS_SECRET_ACCESS_KEY: baseEnv.AWS_SECRET_ACCESS_KEY ?? (baseEnv.IS_OFFLINE ? "local" : undefined),
}