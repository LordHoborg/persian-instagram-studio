import { drizzle } from 'drizzle-orm/better-sqlite3'
import Database from 'better-sqlite3'
import * as schema from './schema'
import path from 'path'
import fs from 'fs'

const DB_PATH = process.env.DATABASE_URL ?? './data/studio.db'
const RESOLVED_DB_PATH = path.isAbsolute(DB_PATH)
  ? DB_PATH
  : path.join(/* turbopackIgnore: true */ process.cwd(), DB_PATH)

// Ensure data directory exists
const dbDir = path.dirname(RESOLVED_DB_PATH)
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// Singleton pattern for Next.js (avoids multiple connections in dev)
declare global {
  var __db: ReturnType<typeof drizzle> | undefined
}

function createDb() {
  const sqlite = new Database(RESOLVED_DB_PATH)
  // Enable WAL mode for better concurrent read performance
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')
  return drizzle(sqlite, { schema })
}

export const db = globalThis.__db ?? createDb()

if (process.env.NODE_ENV !== 'production') {
  globalThis.__db = db
}
