import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import { db } from './client'
import path from 'path'

export async function runMigrations() {
  const migrationsFolder = path.join(process.cwd(), 'lib/db/migrations')
  migrate(db, { migrationsFolder })
  console.log('✅ Database migrations applied')
}
