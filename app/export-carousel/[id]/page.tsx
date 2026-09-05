import { notFound } from 'next/navigation'
import { getPostById } from '@/lib/db'
import { CarouselTemplateId } from '@/components/carousel/carouselMeta'
import { CarouselExportFrame } from '@/components/carousel/CarouselExportFrame'

const ALLOWED_TEMPLATES: CarouselTemplateId[] = ['editorial', 'historical', 'minimal', 'modern', 'magazine']

export default async function ExportCarouselPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ slide?: string; template?: string }>
}) {
  const [{ id }, query] = await Promise.all([params, searchParams])
  const post = await getPostById(id)
  if (!post || post.slides.length === 0) notFound()

  const requestedIndex = Number.parseInt(query.slide ?? '0', 10)
  const slideIndex = Number.isFinite(requestedIndex) ? requestedIndex : 0
  const templateParam = query.template as CarouselTemplateId | undefined
  const template = templateParam && ALLOWED_TEMPLATES.includes(templateParam) ? templateParam : 'modern'

  const slide = post.slides[Math.max(0, Math.min(post.slides.length - 1, slideIndex))]

  return <CarouselExportFrame post={post} slide={slide} template={template} />
}
