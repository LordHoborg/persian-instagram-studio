import JSZip from 'jszip'
import { chromium } from 'playwright'
import path from 'node:path'
import { PostPackage, PostSlide } from '@/types'
import { CarouselTemplateId } from '@/components/carousel/carouselMeta'

const EXPORT_WIDTH = 1080
const EXPORT_HEIGHT = 1350

function getSlideFileLabel(slide: PostSlide) {
  switch (slide.type) {
    case 'cover': return 'cover'
    case 'cta': return 'final'
    case 'source': return 'sources'
    default: return 'slide'
  }
}

export async function exportCarouselWithBrowser(post: PostPackage, template: CarouselTemplateId, baseUrl: string) {
  const windowsChromePath = process.platform === 'win32' && process.env.ProgramFiles
    ? path.join(process.env.ProgramFiles, 'Google', 'Chrome', 'Application', 'chrome.exe')
    : undefined
  const executablePath = process.env.CHROME_EXECUTABLE_PATH?.trim() || windowsChromePath
  const browser = await chromium.launch({
    headless: true,
    executablePath,
  })

  const context = await browser.newContext({
    viewport: { width: EXPORT_WIDTH, height: EXPORT_HEIGHT },
    deviceScaleFactor: 1,
  })

  const page = await context.newPage()
  const zip = new JSZip()
  const slides: Array<{ fileName: string; dataUrl: string; slideNumber: number; type: PostSlide['type'] }> = []

  try {
    for (const slide of post.slides) {
      const url = `${baseUrl}/export-carousel/${post.id}?slide=${slide.slideNumber - 1}&template=${template}`
      await page.goto(url, { waitUntil: 'domcontentloaded' })
      await page.locator('#carousel-export-root').waitFor({ state: 'visible' })
      await page.evaluate(() => document.fonts.ready)

      const locator = page.locator('#carousel-export-root')
      const png = await locator.screenshot({ type: 'png' })
      const fileName = `${String(slide.slideNumber).padStart(2, '0')}-${getSlideFileLabel(slide)}.png`
      zip.file(fileName, png)
      slides.push({
        fileName,
        dataUrl: `data:image/png;base64,${png.toString('base64')}`,
        slideNumber: slide.slideNumber,
        type: slide.type,
      })
    }
  } finally {
    await page.close()
    await context.close()
    await browser.close()
  }

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' })

  return {
    width: EXPORT_WIDTH,
    height: EXPORT_HEIGHT,
    format: 'png',
    slides,
    zipBase64: zipBuffer.toString('base64'),
    zipFileName: `${post.id}-carousel-export.zip`,
  }
}
