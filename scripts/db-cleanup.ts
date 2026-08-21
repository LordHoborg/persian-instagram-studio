/**
 * Cleanup script: remove all generated posts (and their slides/sources)
 * to clear UNIQUE constraint issues from partial test runs.
 *
 * Run with: npx tsx --env-file=.env.local scripts/db-cleanup.ts
 */
import Database from 'better-sqlite3'
import { resolve } from 'path'

const dbPath = resolve('./data/studio.db')
const db = new Database(dbPath)

// Delete in dependency order (slides/sources first, then posts)
const deletedSlides = db.prepare(`DELETE FROM post_slides WHERE post_id IN (SELECT id FROM posts WHERE status = 'generated')`).run()
const deletedSources = db.prepare(`DELETE FROM sources WHERE post_id IN (SELECT id FROM posts WHERE status = 'generated')`).run()
const deletedPosts = db.prepare(`DELETE FROM posts WHERE status = 'generated'`).run()

console.log(`Cleaned up:`)
console.log(`  Posts:   ${deletedPosts.changes}`)
console.log(`  Slides:  ${deletedSlides.changes}`)
console.log(`  Sources: ${deletedSources.changes}`)

db.close()
