'use client'

import { PostPackage, PostSlide } from '@/types'
import { CarouselRenderer } from './CarouselRenderer'
import { CarouselTemplateId, CAROUSEL_TEMPLATES } from './carouselMeta'

interface CarouselExportFrameProps {
  post: PostPackage
  slide: PostSlide
  template: CarouselTemplateId
}

export function CarouselExportFrame({ post, slide, template }: CarouselExportFrameProps) {
  return (
    <div
      id="carousel-export-root"
      style={{
        width: 1080,
        height: 1350,
        padding: 0,
        margin: 0,
        overflow: 'hidden',
        background: 'transparent',
      }}
      dir="rtl"
    >
      <CarouselRenderer
        slide={slide}
        template={template}
        slideCount={post.slides.length}
        className="rounded-none shadow-none"
        context={{
          post: {
            title: post.title,
            topic: post.topic,
            cta: post.cta,
            imageStyle: post.imageStyle,
          },
          sourceMeta: {
            verifiedCount: post.sources.filter(source => source.verificationStatus === 'verified').length,
          },
          themeMeta: {
            label: CAROUSEL_TEMPLATES.find(item => item.id === template)?.label,
          },
        }}
      />
    </div>
  )
}
