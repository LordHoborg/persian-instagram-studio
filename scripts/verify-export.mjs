import { chromium } from 'playwright'
import fs from 'node:fs/promises'
import path from 'node:path'

const baseUrl = 'http://localhost:3000'
const postId = 'ari001u0own5j3m1juaj'
const exportDir = path.join(process.cwd(), 'tmp-export-check')

await fs.mkdir(exportDir, { recursive: true })

const browser = await chromium.launch({
  headless: true,
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
})

const page = await browser.newPage({ viewport: { width: 1440, height: 2200 } })

await page.goto(`${baseUrl}/post/${postId}`, { waitUntil: 'networkidle' })
await page.getByRole('button', { name: 'Export Carousel' }).click()
await page.waitForSelector('text=پیش‌نمایش خروجی', { timeout: 120000 })

const cards = page.locator('img')
const count = await cards.count()
const results = []

for (let i = 0; i < count; i++) {
  const img = cards.nth(i)
  const src = await img.getAttribute('src')
  if (!src?.startsWith('data:image/png;base64,')) continue
  const filePath = path.join(exportDir, `slide-${i + 1}.png`)
  const base64 = src.replace('data:image/png;base64,', '')
  await fs.writeFile(filePath, Buffer.from(base64, 'base64'))
  results.push(filePath)
}

const dimensions = await page.evaluate(() => {
  const root = document.querySelector('#carousel-export-root')
  if (!root) return null
  const rect = root.getBoundingClientRect()
  return { width: rect.width, height: rect.height }
})

console.log(JSON.stringify({ count: results.length, files: results, dimensions }, null, 2))
await browser.close()
