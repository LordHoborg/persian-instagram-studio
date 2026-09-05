import Database from 'better-sqlite3'
import path from 'node:path'

const baseUrl = process.env.BASE_URL ?? 'http://localhost:3017'
const configuredPath = process.env.DATABASE_URL ?? './data/studio.db'
const databasePath = path.isAbsolute(configuredPath) ? configuredPath : path.resolve(process.cwd(), configuredPath)
const sqlite = new Database(databasePath, { readonly: true })

try {
  const post = sqlite.prepare('select id from posts order by created_at desc limit 1').get()
  if (!post?.id) throw new Error('No post is available for export verification')

  const response = await fetch(`${baseUrl}/api/export-carousel`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ postId: post.id, template: 'modern' }),
  })
  const body = await response.json()

  if (!response.ok) throw new Error(body.error ?? `Export failed with HTTP ${response.status}`)
  if (body.width !== 1080 || body.height !== 1350 || !Array.isArray(body.slides) || body.slides.length === 0) {
    throw new Error('Export response has an invalid shape')
  }
  if (!body.zipBase64 || !body.zipFileName) throw new Error('Export response is missing the ZIP payload')

  console.log(JSON.stringify({
    ok: true,
    postId: post.id,
    slides: body.slides.length,
    width: body.width,
    height: body.height,
    zipFileName: body.zipFileName,
  }))
} finally {
  sqlite.close()
}
