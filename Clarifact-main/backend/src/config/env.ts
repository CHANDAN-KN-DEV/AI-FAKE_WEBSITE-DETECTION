import * as dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(4000),

  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1).default("redis://localhost:6379"),
  JWT_SECRET: z.string().min(16),

  JINA_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GROK_API_KEY: z.string().optional(),
  GROK_MODEL: z.string().optional(),
  OPENROUTER_API_KEY: z.string().optional(),
  HIVE_API_KEY: z.string().optional()
});

export const env = envSchema.parse(process.env);

