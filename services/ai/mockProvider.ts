import { AIProviderInterface, AIGenerationRequest, StructuredGenerationRequest, AIGenerationResult, AIModelConfig, GeneratedImageResult, ResearchSource } from './types'
import { PostPackage, PostSlide } from '@/types'
import { generateId } from '@/lib/utils'
import { calculateImageCost, calculateTextCost } from '@/lib/ai/pricing'
import { MOCK_POST_TOPICS } from '@/lib/constants'
import { MODEL_CONFIG } from './modelConfig'

const MOCK_MODELS: AIModelConfig[] = [
  { id: MODEL_CONFIG.cheap, name: 'Luna (cheap)', provider: 'openai', costPer1kInput: 0.00015, costPer1kOutput: 0.0006, capabilities: ['text', 'structured'] },
  { id: MODEL_CONFIG.standard, name: 'Terra (standard)', provider: 'openai', costPer1kInput: 0.005, costPer1kOutput: 0.015, capabilities: ['text', 'structured'] },
  { id: MODEL_CONFIG.premium, name: 'Sol (premium)', provider: 'openai', costPer1kInput: 0.015, costPer1kOutput: 0.06, capabilities: ['text', 'structured'] },
]

const PERSIAN_HOOKS = [
  'آیا می‌دانستید {topic} یک راز پنهان دارد؟',
  'تصور کنید {topic} را از نزدیک ببینید...',
  'این حقایق درباره {topic} شما را شگفت‌زده خواهد کرد',
  'فقط ۱٪ از مردم درباره {topic} این را می‌دانند',
  'داستان {topic} آن‌قدر جالب است که نمی‌توانید رهاش کنید',
  'اگر به {topic} علاقه دارید، این پست را از دست ندهید',
  'بزرگ‌ترین اشتباه درباره {topic} چه بود؟',
  '{topic}: از گذشته تا امروز',
]

const PERSIAN_CAPTIONS = [
  'چقدر درباره {topic} می‌دانید؟\n\nاین پست قرار است نگاهتان را تغییر دهد.\n\nنظر شما چیست؟ 👇',
  '{topic} یکی از جذاب‌ترین بخش‌های تاریخ ماست.\n\nدر این پست به عمق ماجرا می‌رویم.\n\nدوست داشتید سیو کنید 💾',
  'هر بار که درباره {topic} می‌خوانم، چیز تازه‌ای یاد می‌گیرم.\n\nامیدوارم شما هم لذت ببرید.\n\nکدام بخش را بیشتر دوست داشتید؟',
]

const PERSIAN_CTAS = [
  'نظر شما چیست؟',
  'این پست را سیو کنید',
  'برای دوستانتان بفرستید',
  'در کامنت بنویسید',
  'فالو کنید تا بیشتر بدانید',
]

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export class MockAIProvider implements AIProviderInterface {
  getAvailableModels(): AIModelConfig[] {
    return MOCK_MODELS
  }

  async generateText(request: AIGenerationRequest): Promise<AIGenerationResult<string>> {
    await this.simulateDelay()
    const inputTokens = estimateTokens(request.prompt)
    const outputText = this.generateMockText(request)
    const outputTokens = estimateTokens(outputText)
    const cost = calculateTextCost(request.model || 'gpt-4o', inputTokens, outputTokens)

    return {
      success: true,
      data: outputText,
      usage: { inputTokens, outputTokens, estimatedCost: cost },
    }
  }

  async generateStructured<T>(request: StructuredGenerationRequest<T>): Promise<AIGenerationResult<T>> {
    await this.simulateDelay()
    const inputTokens = estimateTokens(request.prompt)

    let data: unknown
    if (request.operation === 'generate_post') {
      data = this.generateMockPost(request.prompt)
    } else if (request.operation === 'generate_ideas') {
      data = this.generateMockTopicCandidates()
    } else if (request.operation === 'brainstorm_ideas') {
      data = { ideas: this.generateMockTopicCandidates().candidates.map(candidate => candidate.topic) }
    } else if (request.operation === 'research_topic') {
      data = this.generateMockResearchSummary(request.prompt)
    } else if (request.operation === 'rewrite_slide') {
      data = this.generateMockSlideRewrite()
    } else if (request.operation === 'improve_hook') {
      data = { hook: getRandom(PERSIAN_HOOKS).replace(/{topic}/g, 'این موضوع'), reasoning: 'نسخه بهبود یافته' }
    } else if (request.operation === 'editorial_review') {
      data = this.generateMockReview()
    } else {
      data = { result: 'mock structured response' }
    }

    const validated = request.schema.safeParse(data)
    if (!validated.success) {
      console.warn('[MockAI] Schema validation failed for', request.operation, validated.error.flatten())
    }

    const outputTokens = estimateTokens(JSON.stringify(data))
    const cost = calculateTextCost(request.model || MODEL_CONFIG.standard, inputTokens, outputTokens)

    return {
      success: true,
      data: (validated.success ? validated.data : data) as T,
      usage: { inputTokens, outputTokens, estimatedCost: cost },
    }
  }

  async researchWithWebSearch(request: StructuredGenerationRequest<unknown>): Promise<AIGenerationResult<unknown>> {
    await this.simulateDelay()
    const inputTokens = estimateTokens(request.prompt)
    const summary = this.generateMockResearchSummary(request.prompt)
    const sources = this.generateMockResearchSources(request.prompt)
    const outputTokens = estimateTokens(JSON.stringify(summary))
    const cost = calculateTextCost(request.model || MODEL_CONFIG.standard, inputTokens, outputTokens)

    return {
      success: true,
      data: {
        summary,
        sources,
      },
      usage: {
        inputTokens,
        outputTokens,
        estimatedCost: cost,
        webSearchCalls: 1,
        webSearchCost: 0.01,
        toolCalls: 1,
      },
    }
  }

  async generateImage(_prompt: string, size = '1024x1024'): Promise<AIGenerationResult<GeneratedImageResult>> {
    await this.simulateDelay(1500)
    const colors = ['1a1a2e', '0f172a', '3d2b1f', 'fafafa', 'fef3c7']
    const color = colors[Math.floor(Math.random() * colors.length)]
    const imageCost = calculateImageCost(MODEL_CONFIG.image, 1, { size })
    return {
      success: true,
      data: {
        assetType: 'url',
        data: `https://placehold.co/1080x1350/${color}/ffffff?text=AI+Generated&font=vazirmatn`,
        mimeType: 'image/png',
        model: MODEL_CONFIG.image,
        size,
      },
      usage: { inputTokens: 0, outputTokens: 0, estimatedCost: imageCost, imageGenerationCount: 1, imageCost },
    }
  }

  private async simulateDelay(ms: number = 800) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private generateMockText(request: AIGenerationRequest): string {
    if (request.operation === 'caption') {
      return getRandom(PERSIAN_CAPTIONS).replace(/{topic}/g, 'این موضوع')
    }
    if (request.operation === 'hashtags') {
      return '#تاریخ_ایران #فرهنگ #ایران #تاریخ #دانستنی'
    }
    return 'متن تولید شده توسط هوش مصنوعی (حالت شبیه‌سازی)'
  }

  private generateMockPost(prompt: string): PostPackage {
    const topic = prompt.includes('موضوع:')
      ? prompt.split('موضوع:')[1].split('\n')[0].trim()
      : getRandom(MOCK_POST_TOPICS)

    const contentType = (['single', 'carousel', 'quote', 'story', 'reel'].find(type => prompt.includes(type)) ?? 'carousel') as PostPackage['contentType']
    const hook = getRandom(PERSIAN_HOOKS).replace(/{topic}/g, topic)
    const slideCount = contentType === 'carousel' ? Math.floor(Math.random() * 6) + 3 : 1
    const slides: PostSlide[] = []

    slides.push({
      id: generateId(),
      slideNumber: 1,
      type: 'cover',
      headline: topic,
      body: 'بررسی عمیق و جذاب',
      visualDirection: 'تصویر هنری مرتبط با موضوع',
      imagePrompt: `Artistic illustration related to ${topic}, Persian style, high quality`,
    })

    for (let i = 2; i <= slideCount; i++) {
      slides.push({
        id: generateId(),
        slideNumber: i,
        type: i === slideCount ? 'cta' : 'content',
        headline: `نکته ${i - 1}: ${this.getRandomPersianHeadline()}`,
        body: this.getRandomPersianBody(),
        visualDirection: 'تصویر مرتبط با متن',
        imagePrompt: `Illustration for ${topic}, slide ${i}, Persian aesthetic`,
      })
    }

    return {
      id: generateId(),
      title: topic,
      topic,
      contentType,
      contentPillar: getRandom(['تاریخ', 'علم', 'تهران قدیم', 'فرهنگ']),
      goal: 'آموزش و جذب مخاطب',
      targetAudience: 'جوانان علاقه‌مند',
      hook,
      slides,
      caption: getRandom(PERSIAN_CAPTIONS).replace(/{topic}/g, topic),
      cta: getRandom(PERSIAN_CTAS),
      hashtags: ['#تاریخ_ایران', '#فرهنگ', '#دانستنی', '#ایران', `#${topic.replace(/\s/g, '_')}`],
      sources: [
        { id: generateId(), title: `دانشنامه ${topic}`, url: '', publisher: 'منبع معتبر', date: '', verified: 'unverified', verificationStatus: 'unverified' },
      ],
      imageStyle: getRandom(['editorial', 'historical', 'minimal', 'modern']),
      status: 'generated',
      createdAt: new Date().toISOString(),
      scheduledAt: null,
      publishedAt: null,
      estimatedCost: { textCost: 0.08, researchCost: 0, imageCost: 0.12, total: 0.20 },
      updatedAt: new Date().toISOString(),
      versionHistory: [],
    }
  }

  private generateMockTopicCandidates() {
    return {
      candidates: [
        { topic: 'تهران در دوره صفویه', pillar: 'تاریخ', reason: 'موضوع جذاب و کم‌تکرار', noveltyScore: 8 },
        { topic: 'زندگی خصوصی ناصرالدین شاه', pillar: 'تاریخ', reason: 'محبوب مخاطبان', noveltyScore: 7 },
        { topic: 'تاریخچه باغ‌های ایرانی', pillar: 'فرهنگ', reason: 'موضوع بصری مناسب', noveltyScore: 6 },
        { topic: 'داستان ساخت برج آزادی', pillar: 'تهران قدیم', reason: 'مرتبط با پیج', noveltyScore: 9 },
        { topic: 'فرهنگ چای در ایران', pillar: 'فرهنگ', reason: 'محتوای سبک و جذاب', noveltyScore: 5 },
      ],
    }
  }

  private generateMockResearchSummary(prompt: string) {
    const topic = prompt.includes('موضوع:') ? prompt.split('موضوع:')[1].split('\n')[0].trim() : 'موضوع'
    return {
      summary: `این یک خلاصه تحقیقاتی شبیه‌سازی شده درباره ${topic} است. در حالت واقعی، اطلاعات از منابع معتبر جمع‌آوری می‌شود.`,
      keyFacts: [
        { claim: `${topic} دارای تاریخچه‌ای غنی است`, confidence: 'high', sourceIds: ['source_1'] },
        { claim: 'این موضوع در دوره‌های مختلف تحول یافته', confidence: 'medium', sourceIds: ['source_2'] },
      ],
    }
  }

  private generateMockResearchSources(prompt: string): ResearchSource[] {
    const topic = prompt.includes('موضوع:') ? prompt.split('موضوع:')[1].split('\n')[0].trim() : 'موضوع'
    return [
      {
        id: 'source_1',
        title: `دانشنامه ${topic}`,
        url: 'https://example.com/source-1',
        publisher: 'منبع شبیه‌سازی',
        publishedAt: undefined,
        provenance: 'openai_web_search',
        verificationStatus: 'verified',
      },
      {
        id: 'source_2',
        title: `آرشیو ${topic}`,
        url: 'https://example.com/source-2',
        publisher: 'آرشیو شبیه‌سازی',
        publishedAt: undefined,
        provenance: 'openai_web_search',
        verificationStatus: 'verified',
      },
    ]
  }

  private generateMockReview() {
    return {
      hook: Math.floor(Math.random() * 3) + 7,
      clarity: Math.floor(Math.random() * 3) + 7,
      originality: Math.floor(Math.random() * 3) + 6,
      persianNaturalness: Math.floor(Math.random() * 3) + 7,
      factualConfidence: Math.floor(Math.random() * 3) + 6,
      visualConsistency: Math.floor(Math.random() * 3) + 7,
      feedback: 'محتوای خوبی است. پیشنهاد می‌شود hook قوی‌تری استفاده شود.',
    }
  }

  private generateMockSlideRewrite(): PostSlide {
    return {
      id: generateId(),
      slideNumber: 1,
      type: 'content',
      headline: 'نسخه بازنویسی شده',
      body: 'این متن بازنویسی شده است. در نسخه واقعی، اینجا محتوای بهبود یافته توسط AI قرار می‌گیرد.',
      visualDirection: 'تصویر بهبود یافته',
      imagePrompt: 'Improved illustration',
    }
  }

  private getRandomPersianHeadline(): string {
    const headlines = [
      'حقایقی که نمی‌دانستید',
      'تاریخچه جالب',
      'مقایسه با امروز',
      'نقش کلیدی',
      'اثرگذاری بر فرهنگ',
      'رازهای پنهان',
    ]
    return getRandom(headlines)
  }

  private getRandomPersianBody(): string {
    const bodies = [
      'در این دوره، تحولات عظیمی رخ داد که تا امروز اثر خود را حفظ کرده است.',
      'مورخان معتقدند این رویداد نقطه عطفی در تاریخ ایران بود.',
      'با نگاهی دقیق‌تر، می‌بینیم که این پدیده ریشه در فرهنگ کهن ایران دارد.',
      'شواهد تاریخی نشان می‌دهد این موضوع اهمیت ویژه‌ای در آن زمان داشت.',
    ]
    return getRandom(bodies)
  }
}

export const mockAIProvider = new MockAIProvider()
