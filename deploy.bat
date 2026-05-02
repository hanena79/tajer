@echo off
chcp 65001 >nul
echo 🚀 بدء نشر تاجر على Vercel + Turso
echo.

REM التحقق من npm
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ npm غير مثبّت. ثبّت Node.js أولاً من https://nodejs.org
    exit /b 1
)

REM 1. تثبيت الأدوات
echo 📦 تثبيت أدوات Turso و Vercel...
npm install -g @tursodatabase/cli vercel

REM 2. تثبيت الحزم
echo 📦 تثبيت حزم المشروع...
cd /d "C:\Users\Republic Of Computer\Projects\tajer"
npm install

REM 3. تسجيل الدخول إلى Turso
echo.
echo 🔑 سجّل الدخول إلى Turso (سيفتح المتصفح)...
turso auth login

REM 4. إنشاء قاعدة البيانات
echo.
echo 🗄️ إنشاء قاعدة بيانات Turso...
set /p DB_NAME="أدخل اسم قاعدة البيانات (افتراضي: tajer-db): "
if "%DB_NAME%"=="" set DB_NAME=tajer-db

turso db create %DB_NAME%

REM 5. الحصول على معلومات الاتصال
echo.
echo 📋 معلومات قاعدة البيانات:
for /f "tokens=*" %%a in ('turso db show %DB_NAME% --url') do set TURSO_URL=%%a
echo URL: %TURSO_URL%

for /f "tokens=*" %%a in ('turso db tokens create %DB_NAME%') do set TURSO_TOKEN=%%a
echo Token: %TURSO_TOKEN%

REM 6. حفظ في .env
echo.
echo 💾 حفظ الإعدادات...
(
echo DATABASE_URL="%TURSO_URL%"
echo TURSO_AUTH_TOKEN="%TURSO_TOKEN%"
echo NEXTAUTH_SECRET="tajer-secret-%random%-mr-%random%"
) > .env

REM 7. تسجيل الدخول إلى Vercel
echo.
echo 🔑 سجّل الدخول إلى Vercel (سيفتح المتصفح)...
vercel login

REM 8. النشر
echo.
echo 🚀 نشر المشروع على Vercel...
vercel --prod

echo.
echo ✅ اكتمل النشر!
echo.
echo ⚠️ مهم: بعد النشر، أضف هذه المتغيّرات في Vercel Dashboard:
echo    DATABASE_URL = %TURSO_URL%
echo    TURSO_AUTH_TOKEN = %TURSO_TOKEN%
echo    NEXTAUTH_SECRET = (موجود في ملف .env)
echo.
echo 📖 ثم شغّل: npx prisma db push
pause
