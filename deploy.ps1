# دليل نشر تاجر (Tajer) على Vercel + Turso
# قم بتشغيل هذا الملف في PowerShell

Write-Host "🚀 بدء نشر تاجر على Vercel + Turso" -ForegroundColor Green
Write-Host ""

# التحقق من وجود npm
if (!(Get-Command npm -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npm غير مثبّت. ثبّت Node.js أولاً من https://nodejs.org" -ForegroundColor Red
    exit 1
}

# 1. تثبيت الأدوات
Write-Host "📦 تثبيت أدوات Turso و Vercel..." -ForegroundColor Cyan
npm install -g @tursodatabase/cli vercel

# 2. تثبيت الحزم
Write-Host "📦 تثبيت حزم المشروع..." -ForegroundColor Cyan
cd "C:\Users\Republic Of Computer\Projects\tajer"
npm install

# 3. تسجيل الدخول إلى Turso
Write-Host ""
Write-Host "🔑 سجّل الدخول إلى Turso (سيفتح المتصفح)..." -ForegroundColor Cyan
turso auth login

# 4. إنشاء قاعدة البيانات
Write-Host ""
Write-Host "🗄️ إنشاء قاعدة بيانات Turso..." -ForegroundColor Cyan
$DB_NAME = Read-Host "أدخل اسم قاعدة البيانات (افتراضي: tajer-db)"
if ([string]::IsNullOrWhiteSpace($DB_NAME)) { $DB_NAME = "tajer-db" }

turso db create $DB_NAME

# 5. الحصول على معلومات الاتصال
Write-Host ""
Write-Host "📋 معلومات قاعدة البيانات:" -ForegroundColor Cyan
$TURSO_URL = turso db show $DB_NAME --url
Write-Host "URL: $TURSO_URL" -ForegroundColor Yellow

$TURSO_TOKEN = turso db tokens create $DB_NAME
Write-Host "Token: $TURSO_TOKEN" -ForegroundColor Yellow

# 6. حفظ في .env
Write-Host ""
Write-Host "💾 حفظ الإعدادات..." -ForegroundColor Cyan
@"
DATABASE_URL="$TURSO_URL"
TURSO_AUTH_TOKEN="$TURSO_TOKEN"
NEXTAUTH_SECRET="tajer-secret-$(Get-Random -Minimum 100000 -Maximum 999999)-mr-$(Get-Random -Minimum 1000 -Maximum 9999)"
"@ | Out-File -FilePath ".env" -Encoding UTF8

# 7. تسجيل الدخول إلى Vercel
Write-Host ""
Write-Host "🔑 سجّل الدخول إلى Vercel (سيفتح المتصفح)..." -ForegroundColor Cyan
vercel login

# 8. النشر
Write-Host ""
Write-Host "🚀 نشر المشروع على Vercel..." -ForegroundColor Cyan
vercel --prod

Write-Host ""
Write-Host "✅ اكتمل النشر!" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️ مهم: بعد النشر، أضف هذه المتغيّرات في Vercel Dashboard:" -ForegroundColor Yellow
Write-Host "   DATABASE_URL = $TURSO_URL" -ForegroundColor White
Write-Host "   TURSO_AUTH_TOKEN = $TURSO_TOKEN" -ForegroundColor White
Write-Host "   NEXTAUTH_SECRET = (موجود في ملف .env)" -ForegroundColor White
Write-Host ""
Write-Host "📖 ثم شغّل: npx prisma db push" -ForegroundColor Cyan
