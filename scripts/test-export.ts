import { getPostById } from '@/lib/db'
import { exportCarousel } from '@/lib/carousel/export'

async function main() {
  const post = await getPostById('ari001u0own5j3m1juaj')
  if (!post) throw new Error('post not found')

  try {
    const result = await exportCarousel(post, 'modern')
    console.log(JSON.stringify({
      width: result.width,
      height: result.height,
      slideCount: result.slides.length,
      files: result.slides.map(slide => slide.fileName),
      firstPrefix: result.slides[0]?.dataUrl.slice(0, 30),
    }, null, 2))
  } catch (error) {
    console.error(error)
    console.error((error as Error)?.stack)
    process.exit(1)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
