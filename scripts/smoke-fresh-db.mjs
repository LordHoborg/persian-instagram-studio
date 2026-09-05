import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import Database from 'better-sqlite3'

const temporaryDirectory = mkdtempSync(path.join(tmpdir(), 'persian-instagram-studio-'))
const databasePath = path.join(temporaryDirectory, 'studio.db')

try {
  const result = spawnSync(
    process.execPath,
    [path.join(process.cwd(), 'node_modules', 'tsx', 'dist', 'cli.mjs'), 'scripts/seed.ts'],
    {
      cwd: process.cwd(),
      env: { ...process.env, DATABASE_URL: databasePath, USE_MOCK_AI: 'true' },
      encoding: 'utf8',
    }
  )

  if (result.status !== 0) {
    throw new Error(result.stderr || result.stdout || `Seed process exited with ${result.status}`)
  }

  const sqlite = new Database(databasePath, { readonly: true })
  try {
    const postCount = sqlite.prepare('select count(*) as count from posts').get().count
    const pillarCount = sqlite.prepare('select count(*) as count from content_pillars').get().count
    const migrationCount = sqlite.prepare('select count(*) as count from __drizzle_migrations').get().count

    if (postCount < 1 || pillarCount < 1 || migrationCount < 1) {
      throw new Error('Fresh database was created without the required seed or migration data')
    }

    console.log(JSON.stringify({ ok: true, postCount, pillarCount, migrationCount }))
  } finally {
    sqlite.close()
  }
} finally {
  rmSync(temporaryDirectory, { recursive: true, force: true })
}
