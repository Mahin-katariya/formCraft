import "dotenv/config"
import { drizzle } from "drizzle-orm/node-postgres";
import { env } from "./env.js"

const db = drizzle(env.DATABASE_URL);
export * from "drizzle-orm";
export * from './schema.js'
export default db;