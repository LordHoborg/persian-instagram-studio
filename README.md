# Persian Instagram Content Studio

استودیو محتوای اینستاگرام فارسی با قدرت هوش مصنوعی.

## شروع سریع

```bash
npm install
npm run dev
```

برنامه در `http://localhost:3000` اجرا می‌شود.

## معماری

- **Next.js 14** با App Router
- **React + TypeScript**
- **Tailwind CSS**
- **Mock AI Provider** (بدون نیاز به API Key برای شروع)

## ساختار پوشه

```
app/                 # صفحات Next.js
components/          # کامپوننت‌های React
  ui/               # کامپوننت‌های پایه
  layout/           # Sidebar, Header
  carousel/         # CarouselRenderer
lib/                # utilities, constants, db, aiService
services/           # abstraction layers
  ai/              # AI providers
  instagram/       # Instagram providers
types/              # TypeScript interfaces
```

## اتصال OpenAI

1. `.env.local` بسازید:
```
OPENAI_API_KEY=sk-...
USE_MOCK_AI=false
```

2. در `lib/aiService.ts`، `OpenAIProvider` را جایگزین `MockAIProvider` کنید.

## اتصال Instagram

1. در Meta Developer Dashboard، Instagram Graph API را فعال کنید.
2. توکن دسترسی را در `.env.local` قرار دهید:
```
INSTAGRAM_ACCESS_TOKEN=...
```

3. در `services/instagram/`، `InstagramProvider` را پیاده‌سازی کنید.

## ویژگی‌های کلیدی

- داشبورد کامل با آمار و هزینه
- ساخت پست با ۴ حالت (خودکار، موضوع، ایده، الهام)
- پیش‌نمایش کاروسل با قالب‌های متنوع
- ویرایشگر اسلاید به اسلاید
- مغز محتوا (Brand Profile + Content Pillars)
- آرشیو جستجوپذیر
- تقویم محتوا
- آنالیز عملکرد
- تنظیمات بودجه و اتوماسیون
- پشتیبانی کامل RTL فارسی

## نکات توسعه آینده

- جایگزینی mock DB با SQLite/Postgres
- اضافه کردن OpenAIProvider واقعی
- اضافه کردن Instagram Graph API
- سیستم export تصاویر (html-to-image)
- semantic search با embeddings
- autonomous agent loop
