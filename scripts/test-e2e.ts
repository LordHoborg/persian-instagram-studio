/**
 * E2E test script for generateDailyPost
 * Run with: npx tsx --env-file=.env.local scripts/test-e2e.ts
 */

import { existsSync } from 'fs'
import { resolve } from 'path'

async function main() {
  // Check DB file
  const dbPath = resolve('./data/studio.db')
  if (!existsSync(dbPath)) {
    console.warn('⚠️  Database file not found at ./data/studio.db — migrations may need to run first.')
    console.warn('   Run: npx drizzle-kit migrate (or the project migration command)')
  }

  // Check API key
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey.trim() === '') {
    console.log('OPENAI_API_KEY not set — skipping real API test. Set it in .env.local to run.')
    process.exit(0)
  }

  // Key is set — run the real test
  process.env.USE_MOCK_AI = 'false'

  try {
    const { generateDailyPost } = await import('../services/ai/generateDailyPost')

    console.log('🚀 Running generateDailyPost with topic: تاریخچه میدان توپخانه تهران')
    console.log('─'.repeat(60))

    const result = await generateDailyPost({
      topic: 'تاریخچه میدان توپخانه تهران',
      withReview: false,
    })

    console.log('\n📦 Full result (JSON):')
    console.log(JSON.stringify(result, null, 2))

    console.log('\n📊 Summary:')
    console.log(`  Topic:          ${result.post.topic}`)
    console.log(`  Hook:           ${result.post.hook}`)
    console.log(`  Slides:         ${result.post.slides.length}`)
    console.log(`  Caption length: ${result.post.caption.length} chars`)
    console.log(`  Sources count:  ${result.post.sources.length}`)
    console.log(`  Total cost:     $${result.totalCost.toFixed(6)}`)
    console.log(`  Session ID:     ${result.generationSessionId}`)

    console.log('\n🎞️  Slides:')
    result.post.slides.forEach((slide, i) => {
      const body = 'body' in slide ? String((slide as { body?: unknown }).body ?? '') : ''
      console.log(`  [${i + 1}] ${(slide as { headline?: string }).headline ?? '(no headline)'}`)
      console.log(`       ${body.slice(0, 100)}${body.length > 100 ? '…' : ''}`)
    })

    console.log(`\n🔍 Web search used: ${result.usedResearch}`)
    console.log(`💾 Saved post ID:   ${result.post.id}`)

    // ── Source verification report ──────────────────────────────────────────
    const allSources = result.post.sources ?? []
    const verifiedSources = allSources.filter(s => s.verificationStatus === 'verified')
    const unverifiedSources = allSources.filter(s => s.verificationStatus !== 'verified')

    console.log(`\n📚 Sources (${allSources.length} total):`)
    console.log(`   ✅ Verified (web search): ${verifiedSources.length}`)
    console.log(`   ⚠️  Unverified (model-generated): ${unverifiedSources.length}`)

    if (verifiedSources.length > 0) {
      console.log('\n   Verified sources:')
      verifiedSources.forEach((s, i) => {
        console.log(`     [${i + 1}] ${s.title}`)
        console.log(`          URL: ${s.url || '(none)'}`)
        if (s.publisher) console.log(`          Publisher: ${s.publisher}`)
      })
    }

    if (unverifiedSources.length > 0) {
      console.log('\n   Unverified (model-generated) sources:')
      unverifiedSources.forEach((s, i) => {
        console.log(`     [${i + 1}] ${s.title} — ${s.url || '(no URL)'}`)
      })
    }

    console.log('\n✅ E2E test passed!')
  } catch (err) {
    console.error('\n❌ E2E test failed:')
    console.error(err)
    process.exit(1)
  }
}

main()
