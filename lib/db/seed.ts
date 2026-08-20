import { db } from './client'
import { brandProfile, contentPillars, posts, postSlides, sources, learnedPatterns, appSettings } from './schema'
import { generateId } from '@/lib/utils'
import { CONTENT_PILLARS_DEFAULT } from '@/lib/constants'

export async function ensureSeeded() {
  // Use a simple check: if posts table has any rows, skip seeding
  const postCount = await db.select().from(posts).limit(1)
  if (postCount.length > 0) return

  console.log('🌱 Seeding database with demo data...')

  // Seed brand profile
  await db.insert(brandProfile).values({
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
    updatedAt: new Date().toISOString(),
  }).onConflictDoNothing()

  // Seed content pillars
  for (const pillar of CONTENT_PILLARS_DEFAULT) {
    await db.insert(contentPillars).values(pillar).onConflictDoNothing()
  }

  // Seed demo posts
  const post1Id = generateId()
  const post2Id = generateId()

  await db.insert(posts).values([
    {
      id: post1Id,
      title: 'تهران در دوره قاجار: از دروازه تا کاخ',
      topic: 'تهران در دوره قاجار',
      contentType: 'carousel',
      contentPillar: 'تهران قدیم',
      goal: 'آشنایی مخاطب با تاریخ تهران',
      targetAudience: 'جوانان علاقه‌مند به تاریخ',
      hook: 'آیا می‌دانستید تهران در دوره قاجار فقط ۱۵ هزار نفر جمعیت داشت؟',
      caption: 'تهران امروز یک کلان‌شهر ۱۵ میلیون نفری است، اما روزی فقط ۱۵ هزار نفر جمعیت داشت.\n\nدر دوره قاجار، این شهر از دروازه‌های قدیمی تا کاخ‌های باشکوه، داستانی پرفراز و نشیب را پشت سر گذاشت.\n\nکدام قسمت از تاریخ تهران را بیشتر دوست دارید؟ 👇',
      cta: 'نظر شما چیست؟',
      hashtags: ['#تهران_قدیم', '#قاجار', '#تاریخ_ایران', '#کاخ_گلستان', '#تهران'],
      imageStyle: 'historical',
      status: 'published',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledAt: null,
      publishedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedCost: { textCost: 0.08, researchCost: 0, imageCost: 0, total: 0.08 },
      qualityScore: { hook: 9, clarity: 8, originality: 8, persianNaturalness: 9, factualConfidence: 8, visualConsistency: 7 },
      performanceMetrics: { views: 12400, reach: 8900, likes: 1450, comments: 89, shares: 234, saves: 567, profileVisits: 123, follows: 45, engagementRate: 4.2 },
    },
    {
      id: post2Id,
      title: 'میرزا شیرازی و ماجرای تنباکو',
      topic: 'میرزا شیرازی و تنباکو',
      contentType: 'carousel',
      contentPillar: 'تاریخ',
      goal: 'آشنایی با مقاومت در برابر استعمار',
      targetAudience: 'علاقه‌مندان به تاریخ معاصر',
      hook: 'یک فتوا که امپراتوری بریتانیا را به زانو درآورد',
      caption: 'یک فتوا که تاریخ ایران را تغییر داد.\n\nمیرزای شیرازی با یک جمله کوتاه، امپراتوری بریتانیا را وادار به عقب‌نشینی کرد.\n\nاین قدرت اتحاد مردم ایران بود. 💪',
      cta: 'این پست را سیو کنید',
      hashtags: ['#تاریخ_معاصر', '#میرزای_شیرازی', '#تنباکو', '#ایران'],
      imageStyle: 'editorial',
      status: 'published',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      scheduledAt: null,
      publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedCost: { textCost: 0.06, researchCost: 0, imageCost: 0, total: 0.06 },
      qualityScore: { hook: 10, clarity: 9, originality: 9, persianNaturalness: 9, factualConfidence: 9, visualConsistency: 8 },
      performanceMetrics: { views: 25600, reach: 18200, likes: 3200, comments: 156, shares: 890, saves: 1200, profileVisits: 340, follows: 89, engagementRate: 5.8 },
    },
  ])

  // Seed slides for post1
  await db.insert(postSlides).values([
    { id: generateId(), postId: post1Id, slideNumber: 1, type: 'cover', headline: 'تهران در دوره قاجار', body: 'از دروازه‌های شهر تا کاخ گلستان', visualDirection: 'تصویر کهنه از تهران قدیم با فیلتر sepia', imagePrompt: 'Old Tehran cityscape, Qajar era, sepia tone, historical buildings' },
    { id: generateId(), postId: post1Id, slideNumber: 2, type: 'content', headline: 'تهران قبل از پایتختی', body: 'قبل از اینکه آقامحمدخان قاجار تهران را پایتخت کند، این شهر یک روستای کوچک در کنار ری بود.', visualDirection: 'نقشه قدیمی تهران', imagePrompt: 'Historical map of Tehran, Qajar period, hand drawn style' },
    { id: generateId(), postId: post1Id, slideNumber: 3, type: 'content', headline: 'دروازه‌های تهران', body: 'تهران قدیم ۱۲ دروازه داشت: دولت، شمیران، دوشان‌تپه، غار، خراسان، عبدالعظیم و...', visualDirection: 'تصویر دروازه دولت', imagePrompt: 'Darvaze Dolat, old Tehran gate, historical painting' },
    { id: generateId(), postId: post1Id, slideNumber: 4, type: 'cta', headline: 'نظر شما چیست؟', body: 'کدام بخش از تاریخ تهران برایتان جالب‌تر است؟ در کامنت بنویسید.', visualDirection: 'پس‌زمینه ساده با لوگو', imagePrompt: 'Minimal background with subtle Tehran skyline' },
  ])

  // Seed slides for post2
  await db.insert(postSlides).values([
    { id: generateId(), postId: post2Id, slideNumber: 1, type: 'cover', headline: 'فتوای تنباکو', body: 'میرزای شیرازی و مبارزه با امتیاز رژی', visualDirection: 'پرتره میرزای شیرازی', imagePrompt: 'Mirza Shirazi portrait, Islamic scholar, 19th century' },
    { id: generateId(), postId: post2Id, slideNumber: 2, type: 'content', headline: 'امتیاز رژی چه بود؟', body: 'انگلیسی‌ها حق انحصاری کشت و فروش تنباکو در ایران را گرفتند.', visualDirection: 'سند تاریخی', imagePrompt: 'Old Persian document, Qajar era, official paper' },
    { id: generateId(), postId: post2Id, slideNumber: 3, type: 'content', headline: 'فتوای تاریخی', body: '«اليوم استعمال تنباکو و توتون بريتانوي حرام است» - این فتوا انقلابی در ایران به پا کرد.', visualDirection: 'متن فتوا', imagePrompt: 'Islamic calligraphy, fatwa text, elegant Persian script' },
    { id: generateId(), postId: post2Id, slideNumber: 4, type: 'cta', headline: 'نتیجه؟', body: 'مردم سیگار را زمین انداختند. بازار تعطیل شد. انگلیس مجبور به لغو امتیاز شد.', visualDirection: 'تصویر اعتراض تاریخی', imagePrompt: 'Historical Persian protest scene, 19th century, crowd gathering' },
  ])

  // Seed sources
  await db.insert(sources).values([
    { id: generateId(), postId: post1Id, title: 'تاریخ تهران - دکتر عبدالله مستوفی', url: '', publisher: 'نشر علمی', publishedAt: null, verificationStatus: 'demo' },
    { id: generateId(), postId: post2Id, title: 'تاریخ مشروطه ایران', url: '', publisher: 'دانشگاه تهران', publishedAt: null, verificationStatus: 'demo' },
  ])

  // Seed learned patterns
  await db.insert(learnedPatterns).values([
    { id: generateId(), pattern: 'کاروسل تاریخی + hook کوتاه + تصویر کهنه', confidence: 0.85, evidence: [post1Id, post2Id], createdAt: new Date().toISOString() },
    { id: generateId(), pattern: 'مقایسه تصویری + آمار عددی', confidence: 0.72, evidence: [post1Id], createdAt: new Date().toISOString() },
  ])

  // Mark as seeded
  await db.insert(appSettings).values({ key: 'seeded', value: true, updatedAt: new Date().toISOString() }).onConflictDoNothing()

  console.log('✅ Database seeded successfully')
}
