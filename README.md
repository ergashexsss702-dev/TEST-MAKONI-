# 🇺🇿 TestMakon — Professional Onlayn Imtihon va Test Platformasi

TestMakon — O‘zbekiston talabalari va o‘quvchilari uchun maxsus ishlab chiqilgan, bir vaqtning o‘zida **500+ faol talaba** imtihon topshira oladigan, xavfsiz va to‘liq avtomatlashtirilgan onlayn test platformasi.

---

## 🚀 Asosiy Imkoniyatlar

- **Haqiqiy Full-Stack Arxitektura**: Node.js/Express backend + React/TypeScript frontend + PostgreSQL/Supabase ma'lumotlar bazasi.
- **Telegram Bot Orqali Ro‘yxatdan O‘tish**: SMS-siz, 6 xonali bir martalik OTP kod orqali haqiqiy shaxsni tasdiqlash (5 daqiqa muddat, brute-force himoyasi).
- **Server-Side Baholash (Scoring)**: Natijalar hech qachon brauzerda hisoblanmaydi — server to‘g‘ri javoblar, ball, foiz va o‘tdi/o‘tmadi holatini mustaqil tekshiradi.
- **Aktiv Oynadan Chiqishlarni Aniqlash**: Imtihon vaqtida talabaning boshqa vkladka yoki ilovaga o‘tganligini (Page Visibility API) aniqlash va ustozga ko‘rsatish.
- **Doimiy Avtomatik Saqlash (Autosave)**: Internet uzilishi yoki sahifa yangilanishida javoblar yo‘qolmaydi; internet tiklanganda server bilan avtomatik sinxronlanadi.
- **DOCX va Matndan Tezkor Import**: Ustozlar test savollarini Word (.docx) faylidan yoki matndan bir zumda yuklaydi. Xatolar (variant yetishmasligi, to‘g‘ri javob belgilanmaganligi) oldindan ko‘rsatiladi.
- **Excel (.xlsx) Eksport**: Natijalarni guruh, test va sana bo‘yicha to‘liq yoki savollar darajasida tahlil bilan Excel formatida yuklab olish.
- **Telegram Xabarnomalar**: Talaba testni tugatgach, ustoz yoki adminga zudlik bilan ball, foiz va chiqishlar soni haqida Telegram xabari boradi.
- **Qayta Topshirish (Retake) Tizimi**: Ustoz ruxsat berishi va sababini audit jurnalida qayd etgan holda urinishni qayta ochib berish.

---

## 🛠 O‘rnatish va Ishga Tushirish (14 Qadamli Qo‘llanma)

### 1. Loyihani yuklab olish va paketlarni o‘rnatish
```bash
git clone <repository-url>
cd testmakon
npm install
```

### 2. Muhit o‘zgaruvchilarini sozlash
`.env.example` faylidan nusxa olib, `.env` faylini yarating:
```bash
cp .env.example .env
```
Quyidagi qiymatlarni kiriting:
```env
PORT=3000
TELEGRAM_BOT_TOKEN="sizning_telegram_bot_tokeningiz"
TELEGRAM_ADMIN_CHAT_ID="sizning_telegram_chat_idingiz"
JWT_SECRET="xavfsiz_maxfiy_kalit"
```

### 3. Supabase loyihasini yaratish (Cloud Deploy uchun)
1. [supabase.com](https://supabase.com) ga kiring va yangi loyiha yarating.
2. Loyiha sozlamalaridan `Database URL`, `Anon Key` va `Service Role Key` ni oling.

### 4. SQL migratsiyalarni qo‘llash
Supabase SQL Editor bo‘limiga o‘ting va loyiha ildizidagi `supabase_schema.sql` fayli tarkibini to‘liq nusxalab, Run tugmasini bosing. Bu:
- Barcha jadvallarni (`profiles`, `groups`, `tests`, `questions`, `test_attempts`, `test_results`, `audit_logs` va h.k.) yaratadi;
- 500+ talaba uchun zarur bo‘lgan PostgreSQL indekslarini o‘rnatadi;
- Row Level Security (RLS) xavfsizlik qoidalarini faollashtiradi.

### 5. Telegram Bot yaratish
1. Telegramda [@BotFather](https://t.me/BotFather) ga kiring.
2. `/newbot` buyrug‘ini bering va bot nomini (masalan: `MeningTestBotim`) kiriting.
3. BotFather bergan HTTP API tokenini `.env` faylidagi `TELEGRAM_BOT_TOKEN` ga qo‘ying.

### 6. Admin Telegram ID ni aniqlash
1. Telegramda [@userinfobot](https://t.me/userinfobot) ga kiring.
2. Sizga berilgan raqamli ID ni `.env` dagi `TELEGRAM_ADMIN_CHAT_ID` ga yozing.

### 7. Mahalliy muhitda ishga tushirish
```bash
npm run dev
```
Brauzerda `http://localhost:3000` manzilini oching.

### 8. Avtomatlashtirilgan testlarni tekshirish
```bash
npm test
```
Tizim ro‘yxatdan o‘tish, Telegram OTP, server-side baholash, Word importi va Excel eksportini avtomatik tekshiradi.

### 9. 500 Talabalik Yuklama Testini O‘tkazish (k6)
k6 dasturini o‘rnating va testni boshlang:
```bash
k6 run load-test-500.js
```
Ushbu skript 500 ta virtual talabaning bir vaqtda kirishi, savollarni olishi, javoblarni avtomatik saqlashi va testni topshirishini sinovdan o‘tkazadi.

### 10. Vercel ga joylashtirish
```bash
npm run build
vercel deploy --prod
```

### 11. Birinchi Admin bilan kirish
Tizimda boshlang‘ich hisoblar tayyor:
- **Admin**: `Anvar Qodirov` (+998 90 123 45 67)
- **Ustoz**: `Malika Rahimova` (+998 93 987 65 43)
- **Talaba**: `Muhammad Aliyev` (+998 99 111 22 33)

(Sayt yuqori o‘ng burchagidagi "Rolni almashtirish" tugmasi orqali ham barcha rollarni darhol sinab ko‘rishingiz mumkin!)

### 12. Yangi guruh yaratish
"Ustoz paneli" -> "Guruhlar" -> "Yangi guruh yaratish" (masalan: `8-A Sinf` yoki `IELTS Intensive`).

### 13. O‘quvchilarni guruhga biriktirish
Guruh ichiga kirib "O‘quvchi qo‘shish" tugmasini bosing va o‘quvchilarni tanlang.

### 14. Birinchi testni yaratish va DOCX yuklash
"Ustoz paneli" -> "Savollarni import qilish":
Word (.docx) faylini sudrab tashlang yoki quyidagi formatdagi matnni kiriting:
```
1. O'zbekiston Respublikasi poytaxti qaysi shahar?
A) Samarqand
*B) Toshkent
C) Buxoro
D) Xiva
[Izoh: Toshkent O'zbekistonning poytaxti hisoblanadi]
```
"Saqlash" tugmasini bosing va testni guruhga faollashtiring!
