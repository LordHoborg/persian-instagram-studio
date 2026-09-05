# Persian Instagram Content Studio

استودیوی فارسی و RTL برای ایده‌پردازی، تولید، بازبینی، ویرایش و خروجی گرفتن از محتوای اینستاگرام.

## شروع سریع

پیش‌نیاز: Node.js 24 تا 26.

```bash
npm install
copy .env.example .env.local
npm run dev
```

برنامه روی `http://localhost:3000` اجرا می‌شود. migrationهای SQLite و داده‌های نمایشی فقط در اولین اجرا به‌صورت خودکار ساخته می‌شوند. فایل دیتابیس محلی داخل `data/` قرار می‌گیرد و در Git ثبت نمی‌شود.

حالت پیش‌فرض `USE_MOCK_AI=true` است؛ بنابراین برای بررسی رابط به کلید API نیاز ندارید.

## اتصال OpenAI

در `.env.local` مقدارهای زیر را تنظیم کنید:

```dotenv
OPENAI_API_KEY=sk-...
USE_MOCK_AI=false
```

انتخاب provider در `services/ai/provider.ts` به‌صورت خودکار انجام می‌شود. مدل‌های متن و تصویر نیز از متغیرهای `OPENAI_MODEL_*` قابل تغییرند. ساخت تصویر در فرم تولید پست اختیاری است تا هزینه ناخواسته ایجاد نشود؛ سقف‌های روزانه، ماهانه و تعداد تصویر از صفحه تنظیمات کنترل می‌شوند.

## خروجی PNG و ZIP

خروجی کاروسل با مرورگر headless و در ابعاد ۱۰۸۰×۱۳۵۰ ساخته می‌شود. Playwright ابتدا از Chromium همراه خود استفاده می‌کند. برای تعیین مرورگر نصب‌شده می‌توانید این متغیر را تنظیم کنید:

```dotenv
CHROME_EXECUTABLE_PATH=C:\Program Files\Google\Chrome\Application\chrome.exe
```

## فرمان‌های توسعه

```bash
npm run dev          # سرور توسعه
npm run build        # build تولید
npm run start        # اجرای build تولید
npm run typecheck    # بررسی TypeScript
npm run lint         # ESLint + قواعد Next.js
npm test             # تست‌های Vitest
npm run smoke:export # تست خروجی در برابر سرور اجراشده روی پورت ۳۰۱۷
npm run smoke:db     # ساخت و بررسی دیتابیس تازه در پوشه موقت
npm run db:migrate   # اجرای دستی migrationها
npm run db:seed      # seed دستی دیتابیس
```

## معماری

- Next.js 16 با App Router و React 19
- TypeScript و Tailwind CSS 4
- SQLite، Drizzle ORM و migrationهای نسخه‌بندی‌شده
- OpenAI Responses API با Structured Outputs و مسیر تحقیق وب
- provider شبیه‌سازی‌شده برای توسعه بدون API Key
- Playwright و JSZip برای خروجی تصویری کاروسل

پوشه‌های اصلی:

```text
app/                  صفحات، Server Components و Route Handlers
components/           اجزای UI، چیدمان و رندر کاروسل
lib/db/               schema، migration، seed و دسترسی داده
lib/prompts/          promptهای نسخه‌بندی‌شده
services/ai/          providerها، routing مدل و جریان تولید محتوا
services/instagram/   قرارداد provider و پیاده‌سازی شبیه‌سازی‌شده
__tests__/            تست‌های Vitest
```

## امکانات فعلی

- داشبورد هزینه، وضعیت محتوا و الگوهای یادگرفته‌شده
- چهار مسیر تولید: خودکار، موضوع، ایده خام و منبع الهام
- تحقیق وب، Structured Output، بازبینی تحریریه و امتیاز کیفیت
- تولید اختیاری تصویر و ثبت تفکیکی هزینه‌ها
- ویرایش مطمئن پست و اسلاید، بهبود Hook و بازنویسی با AI
- پنج قالب کاروسل و دریافت PNG تکی یا ZIP
- مغز محتوا، آرشیو جست‌وجوپذیر، تقویم، آنالیز و تنظیمات بودجه
- حالت تیرهٔ ماندگار، صفحات loading/error/404 و هدرهای امنیتی پایه

## محدودیت فعلی

اتصال واقعی Instagram Graph API هنوز پیاده‌سازی نشده و `services/instagram/mockProvider.ts` فقط برای توسعه است. گزینه‌های اتوماسیون در دیتابیس ذخیره می‌شوند، اما scheduler و انتشار خودکار واقعی تا زمان تکمیل provider اینستاگرام فعال نیستند.
