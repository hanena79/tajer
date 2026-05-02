# تاجر (Tajer) — منصة إدارة المحلّات

> **Tajer** هو تطبيق SaaS متكامل لإدارة المحلّات والشركات الصغيرة في موريتانيا. يجمع بين نقطة البيع السريعة، إدارة المخزون، الفوترة الإلكترونية، والتقارير المتقدّمة — كلّ ذلك بأربعة آلاف أوقية شهريًا.

---

## 🚀 الميزات

| الميزة | الوصف |
|--------|-------|
| **نقطة البيع (POS)** | واجهة سريعة: بحث منتجات، سلّة مشتريات، خصم، ضريبة، إيصال PDF — تعمل حتى بدون إنترنت |
| **إدارة المنتجات** | CRUD كامل، تصنيفات، باركود، صور، استيراد من Excel |
| **إدارة المخزون** | تنبيهات المخزون المنخفض، حركات الدخول/الخروج، حالة المخزون بألوان |
| **الفوترة الإلكترونية** | فواتير PDF احترافية (عربي + فرنسي)، أرقام تسلسلية، إرسال WhatsApp |
| **التقارير المتقدّمة** | مبيعات، أرباح، أكثر المنتجات مبيعًا، حالة المخزون — مع رسوم بيانية وتصدير PDF/Excel |
| **يعمل بدون إنترنت** | حفظ البيعات محليًّا ومزامنتها تلقائيًّا عند عودة الاتصال |
| **ثنائي اللغة** | عربي (RTL) + فرنسي (LTR) — يعملان بسلاسة |
| **PWA** | يُثبّت على الهاتف كتطبيق حقيقي |

---

## 🛠️ التقنيات

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Shadcn/UI
- **Database**: Prisma ORM + SQLite (local dev) / Turso (production)
- **Auth**: Jose JWT sessions
- **Charts**: Recharts
- **PDF**: jsPDF
- **i18n**: next-intl
- **PWA**: next-pwa

---

## 🚀 النشر على Vercel + Turso

### 1. إنشاء قاعدة بيانات Turso
```bash
# ثبّت CLI
npm install -g @tursodatabase/cli

# سجّل الدخول
turso auth login

# أنشئ قاعدة بيانات
turso db create tajer-db

# احصل على رابط الاتصال
turso db show tajer-db --url

# أنشئ رمز دخول
turso db tokens create tajer-db
```

### 2. النشر على Vercel
```bash
# ثبّت Vercel CLI
npm i -g vercel

# سجّل الدخول
vercel login

# انشر (من جذر المشروع)
vercel --prod
```

### 3. أضف متغيّرات البيئة في Vercel Dashboard
- اذهب إلى Project Settings → Environment Variables
- أضف:
  * `DATABASE_URL` = رابط Turso (libsql://...)
  * `TURSO_AUTH_TOKEN` = الرمز الذي أنشأته
  * `NEXTAUTH_SECRET` = مفتاح عشوائي (32+ حرف)

### 4. دفع Schema إلى Turso
```bash
npx prisma db push
```

### 5. ملء البيانات التجريبية (اختياري)
```bash
npx prisma db seed
```

✅ **تمّ!** تطبيقك يعمل الآن على `https://tajer.vercel.app`

---

## ⚡ البدء السريع (محليًّا)

```bash
# 1. استنساخ المستودع
git clone <repo-url>
cd tajer

# 2. تثبيت الاعتماديات
npm install

# 3. إعداد قاعدة البيانات
npx prisma generate
npx prisma db push

# 4. ملء البيانات التجريبية
npx prisma db seed

# 5. تشغيل التطبيق
npm run dev
```

افتح [http://localhost:3000](http://localhost:3000) في المتصفّح.

---

## 🔑 بيانات الدخول التجريبية

| البريد | كلمة المرور | الدور |
|--------|-------------|-------|
| `admin@tajer.mr` | `admin123` | مدير |

---

## 📁 هيكل المشروع

```
tajer/
├── prisma/              # Schema + Seed
├── src/
│   ├── app/[locale]/    # الصفحات (عربي/فرنسي)
│   │   ├── (auth)/      # تسجيل الدخول
│   │   ├── (dashboard)/ # لوحة التحكّم
│   │   │   ├── dashboard/
│   │   │   ├── pos/
│   │   │   ├── products/
│   │   │   ├── inventory/
│   │   │   ├── invoices/
│   │   │   ├── reports/
│   │   │   └── settings/
│   │   └── page.tsx     # صفحة الهبوط
│   ├── components/      # المكوّنات
│   ├── lib/             # Prisma, Auth, Utils
│   └── hooks/           # React hooks
├── messages/            # الترجمات (ar.json, fr.json)
└── public/              # الأصول الثابتة
```

---

## 🌍 اللغات

- **العربية** (افتراضي) — RTL
- **الفرنسية** — LTR

---

## 📄 الترخيص

[MIT](LICENSE) — © 2026 تاجر

---

## 🇲🇷 صُنع في موريتانيا

للتواصل: contact@tajer.mr
