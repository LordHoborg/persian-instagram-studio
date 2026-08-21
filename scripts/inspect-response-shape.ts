/**
 * Diagnostic script: inspect the real OpenAI Responses API payload shape
 * for a web_search_preview call.
 *
 * Run with: npx tsx --env-file=.env.local scripts/inspect-response-shape.ts
 *
 * This script logs a sanitized version of the response structure (no API keys,
 * no sensitive config). It truncates long text fields to 120 chars.
 */

import OpenAI from 'openai'

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 8) return '...'
  if (value === null || value === undefined) return value
  if (typeof value === 'string') {
    return value.length > 120 ? value.slice(0, 120) + '…' : value
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value
  if (Array.isArray(value)) {
    return value.map(v => sanitize(v, depth + 1))
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>
    const result: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(obj)) {
      // Skip anything that looks like an API key or secret
      if (/key|secret|token|auth|password/i.test(k) && typeof v === 'string' && (v as string).length > 10) {
        result[k] = '[REDACTED]'
      } else {
        result[k] = sanitize(v, depth + 1)
      }
    }
    return result
  }
  return value
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey || apiKey.trim() === '') {
    console.error('OPENAI_API_KEY not set. Set it in .env.local.')
    process.exit(1)
  }

  const client = new OpenAI({ apiKey })

  // ── Test A: plain-text (no json_schema) — should preserve annotations ──────
  console.log('🔍 [A] Sending plain-text web_search_preview request (no json_schema)...')
  console.log('─'.repeat(60))

  const response = await client.responses.create({
    model: 'gpt-4o-mini',
    input: [
      {
        role: 'system',
        content: 'Use web search to research the topic. Write a detailed answer in Persian.',
      },
      {
        role: 'user',
        content: 'تاریخچه میدان توپخانه تهران را جستجو کن و خلاصه بده.',
      },
    ],
    tools: [{ type: 'web_search_preview' }],
    // NO json_schema format — plain text so annotations are preserved
    max_output_tokens: 1000,
  })

  console.log('\n📦 FULL SANITIZED RESPONSE STRUCTURE:')
  console.log(JSON.stringify(sanitize(response), null, 2))

  console.log('\n\n📋 OUTPUT ITEMS BREAKDOWN:')
  for (let i = 0; i < (response.output ?? []).length; i++) {
    const item = response.output[i]
    console.log(`\n  [${i}] type = "${item.type}"`)

    if (item.type === 'web_search_call') {
      const ws = item as unknown as Record<string, unknown>
      console.log(`       id     = ${ws['id']}`)
      console.log(`       status = ${ws['status']}`)
      // Log all keys
      console.log(`       keys   = ${Object.keys(ws).join(', ')}`)
      // Log full item sanitized
      console.log(`       full   = ${JSON.stringify(sanitize(ws), null, 6)}`)
    }

    if (item.type === 'message') {
      const msg = item as unknown as Record<string, unknown>
      const content = (msg['content'] as unknown[]) ?? []
      for (let j = 0; j < content.length; j++) {
        const c = content[j] as Record<string, unknown>
        console.log(`       content[${j}].type = "${c['type']}"`)
        if (c['type'] === 'output_text') {
          const annotations = (c['annotations'] as unknown[]) ?? []
          console.log(`       content[${j}].annotations.length = ${annotations.length}`)
          for (let k = 0; k < annotations.length; k++) {
            const ann = annotations[k] as Record<string, unknown>
            console.log(`         annotation[${k}] = ${JSON.stringify(sanitize(ann))}`)
          }
        }
      }
    }
  }

  console.log('\n\n🔑 TOP-LEVEL RESPONSE KEYS:', Object.keys(response).join(', '))
  console.log('\n✅ Inspection complete.')
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
