import { AIProviderInterface, AIGenerationRequest, AIGenerationResult, AIModelConfig } from './types'
import { PostPackage, PostSlide } from '@/types'
import { generateId, estimateTextCost } from '@/lib/utils'
import { MOCK_POST_TOPICS } from '@/lib/constants'

const MOCK_MODELS: AIModelConfig[] = [
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', costPer1kInput: 0.005, costPer1kOutput: 0.015, capabilities: ['text', 'vision', 'structured'] },
  { id: 'gpt-4', name: 'GPT-4', provider: 'openai', costPer1kInput: 0.03, costPer1kOutput: 0.06, capabilities: ['text', 'structured'] },
  { id: 'gpt-3.5', name: 'GPT-3.5 Turbo', provider: 'openai', costPer1kInput: 0.0005, costPer1kOutput: 0.0015, capabilities: ['text'] },
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
    const cost = estimateTextCost(inputTokens, outputTokens, request.model || 'gpt-4o')

    return {
      success: true,
      data: outputText,
      usage: { inputTokens, outputTokens, estimatedCost: cost },
    }
  }

  async generateStructured<T>(request: AIGenerationRequest): Promise<AIGenerationResult<T>> {
    await this.simulateDelay()
    const inputTokens = estimateTokens(request.prompt)

    let data: unknown
    if (request.operation === 'generate_post') {
      data = this.generateMockPost(request.prompt)
    } else if (request.operation === 'generate_ideas') {
      data = this.generateMockIdeas(request.prompt)
    } else if (request.operation === 'rewrite_slide') {
      data = this.generateMockSlideRewrite(request.prompt)
    } else if (request.operation === 'improve_hook') {
      data = this.generateMockHook(request.prompt)
    } else {
      data = { result: 'mock structured response' }
    }

    const outputTokens = estimateTokens(JSON.stringify(data))
    const cost = estimateTextCost(inputTokens, outputTokens, request.model || 'gpt-4o')

    return {
      success: true,
      data: data as T,
      usage: { inputTokens, outputTokens, estimatedCost: cost },
    }
  }

  async generateImage(prompt: string, size?: string): Promise<AIGenerationResult<string>> {
    await this.simulateDelay(1500)
    const colors = ['1a1a2e', '0f172a', '3d2b1f', 'fafafa', 'fef3c7']
    const color = colors[Math.floor(Math.random() * colors.length)]
    return {
      success: true,
      data: `https://placehold.co/1080x1350/${color}/ffffff?text=AI+Generated&font=vazirmatn`,
      usage: { inputTokens: 0, outputTokens: 0, estimatedCost: 0.04 },
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

    const hook = getRandom(PERSIAN_HOOKS).replace(/{topic}/g, topic)
    const slideCount = Math.floor(Math.random() * 6) + 3
    const slides: PostSlide[] = []

    slides.push({
      slideNumber: 1,
      type: 'cover',
      headline: topic,
      body: 'بررسی عمیق و جذاب',
      visualDirection: 'تصویر هنری مرتبط با موضوع',
      imagePrompt: `Artistic illustration related to ${topic}, Persian style, high quality`,
    })

    for (let i = 2; i <= slideCount; i++) {
      slides.push({
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
      contentType: 'carousel',
      contentPillar: getRandom(['تاریخ', 'علم', 'تهران قدیم', 'فرهنگ']),
      goal: 'آموزش و جذب مخاطب',
      targetAudience: 'جوانان علاقه‌مند',
      hook,
      slides,
      caption: getRandom(PERSIAN_CAPTIONS).replace(/{topic}/g, topic),
      cta: getRandom(PERSIAN_CTAS),
      hashtags: ['#تاریخ_ایران', '#فرهنگ', '#دانستنی', '#ایران', `#${topic.replace(/\s/g, '_')}`],
      sources: [
        { id: generateId(), title: `دانشنامه ${topic}`, url: '', publisher: 'منبع معتبر', date: '', verified: 'unverified' },
      ],
      imageStyle: getRandom(['editorial', 'historical', 'minimal', 'modern']),
      status: 'generated',
      createdAt: new Date().toISOString(),
      scheduledAt: null,
      publishedAt: null,
      estimatedCost: { textCost: 0.08, imageCost: 0.12, total: 0.20 },
      versionHistory: [],
    }
  }

  private generateMockIdeas(prompt: string): string[] {
    return [
      'تهران در دوره صفویه',
      'زندگی خصوصی ناصرالدین شاه',
      'تاریخچه باغ‌های ایرانی',
      'میرزا کوچک‌خان و جنگل',
      'داستان ساخت برج آزادی',
      'فرهنگ چای در ایران',
      'تاریخچه خطاطی ایرانی',
      'زندگی عطار نیشابوری',
    ]
  }

  private generateMockSlideRewrite(prompt: string): PostSlide {
    return {
      slideNumber: 1,
      type: 'content',
      headline: 'نسخه بازنویسی شده',
      body: 'این متن بازنویسی شده است. در نسخه واقعی، اینجا محتوای بهبود یافته توسط AI قرار می‌گیرد.',
      visualDirection: 'تصویر بهبود یافته',
      imagePrompt: 'Improved illustration',
    }
  }

  private generateMockHook(prompt: string): string {
    return getRandom(PERSIAN_HOOKS).replace(/{topic}/g, 'این موضوع')
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
