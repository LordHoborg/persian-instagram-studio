'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { getPostById } from '@/lib/db'
import { PostPackage } from '@/types'
import { CarouselTemplateId } from '@/components/carousel/carouselMeta'
import { CarouselExportFrame } from '@/components/carousel/CarouselExportFrame'

const ALLOWED_TEMPLATES: CarouselTemplateId[] = ['editorial', 'historical', 'minimal', 'modern', 'magazine']

export default function ExportCarouselPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const [post, setPost] = useState<PostPackage | null>(null)
  const [loading, setLoading] = useState(true)

  const slideIndex = Number(searchParams.get('slide') ?? '0')
  const templateParam = searchParams.get('template') as CarouselTemplateId | null
  const template = templateParam && ALLOWED_TEMPLATES.includes(templateParam) ? templateParam : 'modern'

  useEffect(() => {
    const load = async () => {
      const result = await getPostById(params.id as string)
      setPost(result)
      setLoading(false)
    }
    load()
  }, [params.id])

  if (loading || !post) {
    return <div style={{ width: 1080, height: 1350, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>loading</div>
  }

  const slide = post.slides[Math.max(0, Math.min(post.slides.length - 1, slideIndex))]

  return <CarouselExportFrame post={post} slide={slide} template={template} />
}
