'use server'

import { 
  PostPackage, ContentPillar, BrandProfile, AIUsage, 
  AutomationSettings, LearnedPattern, MediaAsset, IntegrationStatus,
  CostBudget, PromptTemplate, PostSlide, Source
} from '@/types'
import { generateId } from '@/lib/utils'
import { CONTENT_PILLARS_DEFAULT } from '@/lib/constants'

// In-memory store (will be reset on server restart, but serves as mock DB)
let store: {
  posts: PostPackage[]
  pillars: ContentPillar[]
  brandProfile: BrandProfile
  aiUsage: AIUsage[]
  automation: AutomationSettings
  patterns: LearnedPattern[]
  media: MediaAsset[]
  integration: IntegrationStatus
  budget: CostBudget
  prompts: PromptTemplate[]
  onboardingComplete: boolean
} = {
  posts: [],
  pillars: [...CONTENT_PILLARS_DEFAULT],
  brandProfile: {
    pageTopic: '',
    targetAudience: '',
    writingStyle: 'محاوره‌ای ولی آگاهانه',
    visualStyle: 'مینیمال و تمیز',
    preferredTopics: [],
    avoidedTopics: [],
    preferredHooks: [],
    captionRules: 'کپشن کوتاه و جذاب باشد. از ایموجی استفاده شود.',
    persianLanguageRules: 'زبان فارسی روان و امروزی. از کلمات بیگانه غیرضروری پرهیز شود.',
    ctaStyle: 'مهربان و دعوت‌کننده',
    sourcePolicy: 'منابع معتبر علمی و تاریخی',
    imageStyle: 'رنگ‌های گرم با کنتراست ملایم',
    successfulPatterns: [],
    failedPatterns: [],
    customInstructions: '',
  },
  aiUsage: [],
  automation: {
    publishDays: ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه'],
    suggestedHour: 19,
    postsPerDay: 1,
    allowedFormats: ['carousel', 'single', 'quote'],
    autoGenerate: false,
    autoPublish: false,
    requireApproval: true,
  },
  patterns: [],
  media: [],
  integration: {
    instagram: { connected: false },
    openai: { configured: false },
  },
  budget: {
    dailyBudget: 2,
    monthlyBudget: 30,
    imageGenerationLimit: 50,
    maxRetries: 3,
  },
  prompts: [
    { id: '1', key: 'topic_generator', name: 'تولیدکننده موضوع', prompt: '...', description: 'تولید ایده‌های موضوعی' },
    { id: '2', key: 'post_writer', name: 'نویسنده پست', prompt: '...', description: 'نوشتن محتوای کامل پست' },
    { id: '3', key: 'carousel_writer', name: 'نویسنده کاروسل', prompt: '...', description: 'نوشتن اسلایدهای کاروسل' },
    { id: '4', key: 'caption_writer', name: 'نویسنده کپشن', prompt: '...', description: 'نوشتن کپشن اینستاگرام' },
    { id: '5', key: 'fact_checker', name: 'بررسی‌کننده حقایق', prompt: '...', description: 'بررسی صحت ادعاها' },
  ],
  onboardingComplete: false,
}

// Seed with realistic Persian mock data
function seedData() {
  if (store.posts.length > 0) return

  const mockPosts: PostPackage[] = [
    {
      id: generateId(),
      title: 'تهران در دوره قاجار: از دروازه تا کاخ',
      topic: 'تهران در دوره قاجار',
      contentType: 'carousel',
      contentPillar: 'تهران قدیم',
      goal: 'آشنایی مخاطب با تاریخ تهران',
      targetAudience: 'جوانان علاقه‌مند به تاریخ',
      hook: 'آیا می‌دانستید تهران در دوره قاجار فقط ۱۵ هزار نفر جمعیت داشت؟',
      slides: [
        { slideNumber: 1, type: 'cover', headline: 'تهران در دوره قاجار', body: 'از دروازه‌های شهر تا کاخ گلستان', visualDirection: 'تصویر کهنه از تهران قدیم با فیلتر sepia', imagePrompt: 'Old Tehran cityscape, Qajar era, sepia tone, historical buildings' },
        { slideNumber: 2, type: 'content', headline: 'تهران قبل از پایتختی', body: 'قبل از اینکه آقامحمدخان قاجار تهران را پایتخت کند، این شهر یک روستای کوچک در کنار ری بود.', visualDirection: 'نقشه قدیمی تهران', imagePrompt: 'Historical map of Tehran, Qajar period, hand drawn style' },
        { slideNumber: 3, type: 'content', headline: 'دروازه‌های تهران', body: 'تهران قدیم ۱۲ دروازه داشت: دولت، شمیران، دوشان‌تپه، غار، خراسان، عبدالعظیم و...', visualDirection: 'تصویر دروازه دولت', imagePrompt: 'Darvaze Dolat, old Tehran gate, historical painting' },
        { slideNumber: 4, type: 'content', headline: 'کاخ گلستان', body: 'قلب قدرت قاجار. جایی که ناصرالدین شاه عکاسی می‌کرد و امیرکبیر برنامه‌ریزی می‌کرد.', visualDirection: 'تصویر کاخ گلستان', imagePrompt: 'Golestan Palace, Qajar architecture, ornate details' },
        { slideNumber: 5, type: 'cta', headline: 'نظر شما چیست؟', body: 'کدام بخش از تاریخ تهران برایتان جالب‌تر است؟ در کامنت بنویسید.', visualDirection: 'پس‌زمینه ساده با لوگو', imagePrompt: 'Minimal background with subtle Tehran skyline' },
      ],
      caption: 'تهران امروز یک کلان‌شهر ۱۵ میلیون نفری است، اما روزی فقط ۱۵ هزار نفر جمعیت داشت.\n\nدر دوره قاجار، این شهر از دروازه‌های قدیمی تا کاخ‌های باشکوه، داستانی پرفراز و نشیب را پشت سر گذاشت.\n\nکدام قسمت از تاریخ تهران را بیشتر دوست دارید؟ 👇',
      cta: 'نظر شما چیست؟',
      hashtags: ['#تهران_قدیم', '#قاجار', '#تاریخ_ایران', '#کاخ_گلستان', '#تهران'],
      sources: [
        { id: generateId(), title: 'تاریخ تهران - دکتر عبدالله مستوفی', url: '', publisher: 'نشر علمی', date: '', verified: 'verified' },
      ],
      imageStyle: 'historical',
      status: 'published',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledAt: null,
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedCost: { textCost: 0.08, imageCost: 0.12, total: 0.20 },
      qualityScore: { hook: 9, clarity: 8, originality: 8, persianNaturalness: 9, factualConfidence: 8, visualConsistency: 7 },
      performanceMetrics: { views: 12400, reach: 8900, likes: 1450, comments: 89, shares: 234, saves: 567, profileVisits: 123, follows: 45, engagementRate: 4.2 },
      versionHistory: [],
    },
    {
      id: generateId(),
      title: 'میرزا شیرازی و ماجرای تنباکو',
      topic: 'میرزا شیرازی و تنباکو',
      contentType: 'carousel',
      contentPillar: 'تاریخ',
      goal: 'آشنایی با مقاومت در برابر استعمار',
      targetAudience: 'علاقه‌مندان به تاریخ معاصر',
      hook: 'یک فتوا که امپراتوری بریتانیا را به زانو درآورد',
      slides: [
        { slideNumber: 1, type: 'cover', headline: 'فتوای تنباکو', body: 'میرزای شیرازی و مبارزه با امتیاز رژی', visualDirection: 'پرتره میرزای شیرازی', imagePrompt: 'Mirza Shirazi portrait, Islamic scholar, 19th century' },
        { slideNumber: 2, type: 'content', headline: 'امتیاز رژی چه بود؟', body: 'انگلیسی‌ها حق انحصاری کشت و فروش تنباکو در ایران را گرفتند. حتی کشاورزان ایرانی نمی‌توانستست تنباکو بکارند.', visualDirection: 'سند تاریخی', imagePrompt: 'Old Persian document, Qajar era, official paper' },
        { slideNumber: 3, type: 'content', headline: 'فتوای تاریخی', body: '«اليوم استعمال تنباکو و توتون بريتانوي حرام است» - این فتوا انقلابی در ایران به پا کرد.', visualDirection: 'متن فتوا', imagePrompt: 'Islamic calligraphy, fatwa text, elegant Persian script' },
        { slideNumber: 4, type: 'content', headline: 'نتیجه؟', body: 'مردم سیگار را زمین انداختند. بازار تعطیل شد. انگلیس مجبور به لغو امتیاز شد.', visualDirection: 'تصویر اعتراض تاریخی', imagePrompt: 'Historical Persian protest scene, 19th century, crowd gathering' },
      ],
      caption: 'یک فتوا که تاریخ ایران را تغییر داد.\n\nمیرزای شیرازی با یک جمله کوتاه، امپراتوری بریتانیا را وادار به عقب‌نشینی کرد.\n\nاین قدرت اتحاد مردم ایران بود. 💪',
      cta: 'این پست را سیو کنید',
      hashtags: ['#تاریخ_معاصر', '#میرزای_شیرازی', '#تنباکو', '#ایران'],
      sources: [
        { id: generateId(), title: 'تاریخ مشروطه ایران', url: '', publisher: 'دانشگاه تهران', date: '', verified: 'verified' },
      ],
      imageStyle: 'editorial',
      status: 'published',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledAt: null,
      publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedCost: { textCost: 0.06, imageCost: 0.08, total: 0.14 },
      qualityScore: { hook: 10, clarity: 9, originality: 9, persianNaturalness: 9, factualConfidence: 9, visualConsistency: 8 },
      performanceMetrics: { views: 25600, reach: 18200, likes: 3200, comments: 156, shares: 890, saves: 1200, profileVisits: 340, follows: 89, engagementRate: 5.8 },
      versionHistory: [],
    },
    {
      id: generateId(),
      title: '۵ دانشمند ایرانی که جهان را تغییر دادند',
      topic: 'دانشمندان ایرانی',
      contentType: 'carousel',
      contentPillar: 'علم',
      goal: 'افتخار به پیشینه علمی ایران',
      targetAudience: 'دانش‌آموزان و دانشجویان',
      hook: 'این‌ها فقط بخشی از غول‌های علم ایران هستند',
      slides: [
        { slideNumber: 1, type: 'cover', headline: '۵ دانشمند برتر ایران', body: 'از خوارزمی تا ابن سینا', visualDirection: 'تصویر کهکشان با المان‌های ایرانی', imagePrompt: 'Cosmic background with Persian geometric patterns, stars, dark blue' },
        { slideNumber: 2, type: 'content', headline: 'خوارزمی', body: 'پدر جبر. الگوریتم از نام او گرفته شده. بدون او، کامپیوتر امروز وجود نداشت.', visualDirection: 'پرتره خوارزمی', imagePrompt: 'Al Khwarizmi portrait, Islamic golden age, scholarly' },
        { slideNumber: 3, type: 'content', headline: 'ابن سینا', body: 'شيخ الرئيس. دانشمندی که در پزشکی، فلسفه و منطق سرآمد بود. قانون در طب او ۷۰۰ سال مرجع بود.', visualDirection: 'پرتره ابن سینا', imagePrompt: 'Ibn Sina portrait, Persian miniature style, detailed' },
        { slideNumber: 4, type: 'content', headline: 'بیرونی', body: 'اولین کسی که زمین گرد بودن را ثابت کرد. ۱۰۰۰ سال پیش از کلمب.', visualDirection: 'تصویر زمین و ستارگان', imagePrompt: 'Earth and stars, ancient astronomical illustration style' },
        { slideNumber: 5, type: 'content', headline: 'خیام', body: 'ریاضیدان، شاعر و منجم. تقویم جلالی را ساخت که دقیق‌تر از تقویم گریگوری است.', visualDirection: 'تصویر رصدخانه قدیمی', imagePrompt: 'Ancient observatory, Persian architecture, night sky' },
        { slideNumber: 6, type: 'content', headline: 'توسی', body: 'نصیرالدین توسی. بنیان‌گذار رصدخانه مراغه. بزرگ‌ترین اخترشناس تاریخ.', visualDirection: 'رصدخانه مراغه', imagePrompt: 'Maragheh observatory, historical illustration, detailed' },
      ],
      caption: 'ایران فقط تاریخ و شعر نیست.\n\nایران مهد علم و دانش بود. این ۵ نفر فقط بخشی از غول‌هایی هستند که جهان مدیون آن‌هاست.\n\nکدام یک را بیشتر دوست دارید؟ 👇',
      cta: 'دوست داشتید سیو کنید',
      hashtags: ['#علم', '#ایران', '#خوارزمی', '#ابن_سینا', '#تاریخ_علم'],
      sources: [
        { id: generateId(), title: 'دانشمندان ایرانی', url: '', publisher: 'دانشنامه ایرانیکا', date: '', verified: 'verified' },
      ],
      imageStyle: 'modern',
      status: 'scheduled',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      publishedAt: null,
      estimatedCost: { textCost: 0.10, imageCost: 0.16, total: 0.26 },
      versionHistory: [],
    },
    {
      id: generateId(),
      title: 'داستان قهوه در ایران',
      topic: 'تاریخچه قهوه در ایران',
      contentType: 'single',
      contentPillar: 'فرهنگ',
      goal: 'آشنایی با فرهنگ قهوه‌خانه‌های ایران',
      targetAudience: 'جوانان علاقه‌مند به فرهنگ',
      hook: 'قهوه چطور به ایران آمد و قهوه‌خانه‌ها را ساخت؟',
      slides: [
        { slideNumber: 1, type: 'cover', headline: 'قهوه در ایران', body: 'از صفویه تا امروز', visualDirection: 'فنجان قهوه سنتی', imagePrompt: 'Traditional Persian coffee cup, ornate design, warm lighting' },
      ],
      caption: 'قهوه فقط یک نوشیدنی نیست.\n\nدر ایران، قهوه تاریخی ۵۰۰ ساله دارد. از قهوه‌خانه‌های صفوی تا کافه‌های امروز.\n\nشما کدام را ترجیح می‌دهید: قهوه ترک یا اسپرسو؟ ☕',
      cta: 'نظر بدهید',
      hashtags: ['#قهوه', '#فرهنگ_ایران', '#قهوه_خانه', '#تاریخ'],
      sources: [],
      imageStyle: 'minimal',
      status: 'draft',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledAt: null,
      publishedAt: null,
      estimatedCost: { textCost: 0.04, imageCost: 0.04, total: 0.08 },
      versionHistory: [],
    },
  ]

  store.posts = mockPosts
  store.brandProfile = {
    pageTopic: 'تاریخ و فرهنگ ایران با زبانی مدرن',
    targetAudience: 'جوانان ۱۸ تا ۳۵ سال علاقه‌مند به تاریخ و فرهنگ',
    writingStyle: 'محاوره‌ای، دوستانه ولی آگاهانه. از کنایه و طناب لطف استفاده شود.',
    visualStyle: 'مینیمال با المان‌های سنتی',
    preferredTopics: ['تاریخ ایران', 'تهران قدیم', 'شخصیت‌های تاریخی', 'فرهنگ ایرانی'],
    avoidedTopics: ['سیاست روز', 'مذهب حساس', 'مسائل جنجالی'],
    preferredHooks: ['سوال چالشی', 'آمار شگفت‌انگیز', 'مقایسه قدیم و جدید'],
    captionRules: 'کپشن کوتاه (زیر ۱۵۰ کلمه). از ایموجی استفاده شود. CTA روشن در انتها.',
    persianLanguageRules: 'زبان فارسی روان و امروزی. از کلمات بیگانه غیرضروری پرهیز شود.',
    ctaStyle: 'مهربان و دعوت‌کننده. از دستور مستقیم استفاده نشود.',
    sourcePolicy: 'منابع معتبر علمی و تاریخی. ترجیحاً فارسی.',
    imageStyle: 'رنگ‌های گرم با کنتراست ملایم. فونت‌های خوانا.',
    successfulPatterns: ['کاروسل تاریخی با hook قوی', 'مقایسه تصویری قدیم و جدید'],
    failedPatterns: ['پست‌های بلند و بدون تصویر', 'موضوعات سیاسی'],
    customInstructions: 'همیشه یک fact جالب در اول پست بگذار. از زبان طناز استفاده کن ولی به تاریخ و فرهنگ احترام بگذار.',
  }
  store.onboardingComplete = true
  store.patterns = [
    { id: generateId(), pattern: 'کاروسل تاریخی + hook کوتاه + تصویر کهنه', confidence: 0.85, evidence: ['post-1', 'post-2'], createdAt: new Date().toISOString() },
    { id: generateId(), pattern: 'مقایسه تصویری + آمار عددی', confidence: 0.72, evidence: ['post-3'], createdAt: new Date().toISOString() },
  ]
}

seedData()

export async function getPosts(): Promise<PostPackage[]> {
  return [...store.posts].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getPostById(id: string): Promise<PostPackage | null> {
  return store.posts.find(p => p.id === id) || null
}

export async function createPost(post: Omit<PostPackage, 'id' | 'createdAt' | 'versionHistory'>): Promise<PostPackage> {
  const newPost: PostPackage = {
    ...post,
    id: generateId(),
    createdAt: new Date().toISOString(),
    versionHistory: [],
  }
  store.posts.push(newPost)
  return newPost
}

export async function updatePost(id: string, updates: Partial<PostPackage>): Promise<PostPackage | null> {
  const idx = store.posts.findIndex(p => p.id === id)
  if (idx === -1) return null

  const oldPost = { ...store.posts[idx] }
  store.posts[idx] = { ...oldPost, ...updates }

  // Add version history
  if (store.posts[idx].versionHistory) {
    store.posts[idx].versionHistory.unshift({
      id: generateId(),
      createdAt: new Date().toISOString(),
      changes: 'ویرایش دستی',
      snapshot: { title: oldPost.title, caption: oldPost.caption, hook: oldPost.hook },
    })
  }

  return store.posts[idx]
}

export async function deletePost(id: string): Promise<boolean> {
  const idx = store.posts.findIndex(p => p.id === id)
  if (idx === -1) return false
  store.posts.splice(idx, 1)
  return true
}

export async function getPillars(): Promise<ContentPillar[]> {
  return [...store.pillars]
}

export async function updatePillars(pillars: ContentPillar[]): Promise<void> {
  store.pillars = pillars
}

export async function getBrandProfile(): Promise<BrandProfile> {
  return { ...store.brandProfile }
}

export async function updateBrandProfile(profile: BrandProfile): Promise<void> {
  store.brandProfile = profile
}

export async function getAIUsage(): Promise<AIUsage[]> {
  return [...store.aiUsage]
}

export async function addAIUsage(usage: Omit<AIUsage, 'id' | 'createdAt'>): Promise<AIUsage> {
  const newUsage = { ...usage, id: generateId(), createdAt: new Date().toISOString() }
  store.aiUsage.push(newUsage)
  return newUsage
}

export async function getAutomationSettings(): Promise<AutomationSettings> {
  return { ...store.automation }
}

export async function updateAutomationSettings(settings: AutomationSettings): Promise<void> {
  store.automation = settings
}

export async function getPatterns(): Promise<LearnedPattern[]> {
  return [...store.patterns]
}

export async function addPattern(pattern: Omit<LearnedPattern, 'id' | 'createdAt'>): Promise<LearnedPattern> {
  const newPattern = { ...pattern, id: generateId(), createdAt: new Date().toISOString() }
  store.patterns.push(newPattern)
  return newPattern
}

export async function getIntegrationStatus(): Promise<IntegrationStatus> {
  return { ...store.integration }
}

export async function updateIntegrationStatus(status: IntegrationStatus): Promise<void> {
  store.integration = status
}

export async function getBudget(): Promise<CostBudget> {
  return { ...store.budget }
}

export async function updateBudget(budget: CostBudget): Promise<void> {
  store.budget = budget
}

export async function getPrompts(): Promise<PromptTemplate[]> {
  return [...store.prompts]
}

export async function updatePrompts(prompts: PromptTemplate[]): Promise<void> {
  store.prompts = prompts
}

export async function isOnboardingComplete(): Promise<boolean> {
  return store.onboardingComplete
}

export async function setOnboardingComplete(complete: boolean): Promise<void> {
  store.onboardingComplete = complete
}

export async function getMedia(): Promise<MediaAsset[]> {
  return [...store.media]
}

export async function addMedia(media: Omit<MediaAsset, 'id' | 'createdAt'>): Promise<MediaAsset> {
  const newMedia = { ...media, id: generateId(), createdAt: new Date().toISOString() }
  store.media.push(newMedia)
  return newMedia
}
