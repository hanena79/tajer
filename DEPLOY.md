# 🚀 دليل نشر تاجر (Tajer) — Vercel + Turso

## الطريقة السريعة (موصى بها)

### 1. شغّل ملف النشر التلقائي

افتح **PowerShell** كـ Administrator ونفّذ:

```powershell
cd "C:\Users\Republic Of Computer\Projects\tajer"
.\deploy.ps1
```

أو افتح **CMD** ونفّذ:

```cmd
cd "C:\Users\Republic Of Computer\Projects\tajer"
deploy.bat
```

---

## الطريقة اليدوية (إذا فشلت الطريقة السريعة)

### الخطوة 1: تثبيت الأدوات

```bash
npm install -g @tursodatabase/cli vercel
```

### الخطوة 2: تثبيت حزم المشروع

```bash
cd "C:\Users\Republic Of Computer\Projects\tajer"
npm install
```

### الخطوة 3: إنشاء قاعدة بيانات Turso

```bash
# سجّل الدخول (يفتح المتصفح)
turso auth login

# أنشئ قاعدة البيانات
turso db create tajer-db

# احصل على الرابط
turso db show tajer-db --url
# انسخ الناتج: libsql://tajer-db-USERNAME.turso.io

# أنشئ رمز الدخول
turso db tokens create tajer-db
# انسخ الرمز
```

### الخطوة 4: رفع المشروع على GitHub

1. ادخل إلى https://github.com/new
2. اسم المستودع: `tajer`
3. اضغط **Create repository**
4. شغّل في Terminal:

```bash
git remote add origin https://github.com/YOUR_USERNAME/tajer.git
git branch -M main
git add .
git commit -m "Tajer v1.0"
git push -u origin main
```

### الخطوة 5: النشر على Vercel

```bash
# سجّل الدخول (يفتح المتصفح)
vercel login

# انشر المشروع
vercel
```

اتبع التعليمات واربط بمستودع GitHub.

### الخطوة 6: إضافة متغيّرات البيئة

1. ادخل إلى https://vercel.com/dashboard
2. اختر مشروع **tajer**
3. اذهب إلى **Settings** → **Environment Variables**
4. أضف:

| المتغيّر | القيمة |
|----------|--------|
| `DATABASE_URL` | `libsql://tajer-db-USERNAME.turso.io` |
| `TURSO_AUTH_TOKEN` | الرمز من الخطوة 3 |
| `NEXTAUTH_SECRET` | أيّ نص عشوائي طويل |

5. اضغط **Save** ثم **Redeploy**

### الخطوة 7: دفع Schema إلى Turso

```bash
# في مجلد المشروع
npx prisma db push

# ملء البيانات التجريبية (اختياري)
npx prisma db seed
```

---

## ✅ تمّ!

تطبيقك يعمل على: `https://tajer.vercel.app`

بيانات الدخول: `admin@tajer.mr` / `admin123`

---

## 🔧 استكشاف الأخطاء

| المشكلة | الحل |
|---------|------|
| `turso: command not found` | شغّل: `npm install -g @tursodatabase/cli` |
| `vercel: command not found` | شغّل: `npm install -g vercel` |
| Build fails on Vercel | تأكد من إضافة متغيّرات البيئة |
| Database connection error | تأكد من صحة `DATABASE_URL` و `TURSO_AUTH_TOKEN` |

---

## 📞 دعم

للمساعدة: افتح Terminal في مجلد المشروع واكتب:

```bash
vercel --help
turso --help
```

أو تواصل معي! 🚀
