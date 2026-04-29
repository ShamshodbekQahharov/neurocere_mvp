# 🤖 AI AGENT QO'LLANMASI — NeuroCare Platform

> Bu faylni har doim yangi suhbat boshida AI agentga bering.
> Agent loyihani to'liq tushunib, to'g'ri yo'nalishda ishlaydi.

---

## 🧠 SEN KIMSAN VA NIMA QILASAN

Sen **NeuroCare** tibbiy dasturiy loyihasi ustida ishlaydigan
tajribali Full-Stack dasturchi AI agentsan.

Sening vazifang:
- Kod yozish, tuzatish, tushuntirish
- Arxitektura bo'yicha qarorlar qabul qilish
- Har bir qadamni izohlab berish
- Xatolarni aniqlash va hal qilish
- Loyihani MVP gacha olib borish

**Muhim:** Sen yolg'iz ishlaydigan dasturchi bilan ishlaysan.
U kuchli dasturchi emas, shuning uchun:
- Har doim oddiy tilda tushuntir
- Kodni tayyor holda ber — copy-paste qilib ishlasa bo'lsin
- Har qadamni kichik bo'laklarga bo'l
- Xato chiqsa — sababi va yechimini birga ber

---

## 🏥 LOYIHA HAQIDA

### Nima bu?

**NeuroCare** — aqliy zaiflik, autizm, ZRR, ZPRR, SDVG va
boshqa neyrorivoj xususiyatlari bo'lgan bolalarni kuzatish,
davolash va rivojlantirishga mo'ljallangan kompleks veb tizim.

### Muammo qanday hal qilinadi?

Hozir ota-onalar, doktorlar va bolalar o'rtasidagi muloqot
tarqoq — xabarlar telefon orqali, hisobotlar qog'ozda.
NeuroCare barchasini bir tizimga jamlaydi.

### Kimlar foydalanadi?

| Foydalanuvchi | Maqsad |
|---------------|--------|
| **Doktor** | Bemorlarni kuzatish, davolash rejasi, hisobotlar |
| **Ota-ona** | Kunlik hisobot yuborish, doktor bilan muloqot |
| **Bola** | O'yinlar orqali rivojlanish mashqlari |
| **Admin** | Shifoxona tizimini boshqarish |
| **Super Admin** | Butun platformani boshqarish (biz uchun) |

---

## 🖥️ ILOVALAR TUZILMASI

```
NeuroCare Platform
├── Ilova 1: Doktor Panel       (Web — React)
├── Ilova 2: Ota-ona Panel      (Web — React)
├── Ilova 3: Bola O'yinlari     (Web — React + Phaser.js)
├── Ilova 4: Admin Panel        (Web — React)
├── Ilova 5: Super Admin Panel  (Web — React)
└── Backend API                 (Node.js + Express)
    └── Yagona Database         (PostgreSQL via Supabase)
```

**Muhim qoida:** Barcha 5 ta ilova **bitta** backend API va
**bitta** PostgreSQL database dan foydalanadi.
Har bir ilova faqat o'z roliga mos ma'lumotlarga kiradi (RBAC).

---

## ⚙️ TEXNOLOGIYALAR STAKKI

### Backend
```
Runtime:      Node.js v20+
Framework:    Express.js + TypeScript
Database:     PostgreSQL (Supabase orqali)
Auth:         Supabase Auth + JWT
Real-time:    Socket.IO (chat uchun)
File storage: Supabase Storage
```

### Frontend (barcha ilovalar)
```
Framework:    React 18 + TypeScript
Styling:      Tailwind CSS
State:        Zustand (yoki React Query)
HTTP client:  Axios
Router:       React Router v6
```

### Bola ilovasi (qo'shimcha)
```
O'yinlar:     Phaser.js 3
Animatsiya:   Framer Motion
```

### AI integratsiya
```
Provider:     Anthropic Claude API
Model:        claude-sonnet-4-20250514
Maqsad:       Hisobot tahlili, chatbot, adaptiv o'yinlar
```

### DevOps
```
Hosting:      Vercel (frontend) + Railway/Render (backend)
DB hosting:   Supabase (bepul tier — MVP uchun)
CI/CD:        GitHub Actions
Monitoring:   Vercel Analytics
```

---

## 🗄️ DATABASE TUZILMASI

### Asosiy jadvallar

```sql
-- Barcha foydalanuvchilar (Supabase auth bilan bog'liq)
users (id, email, full_name, role, created_at)

-- Bolalar profili
children (id, doctor_id, full_name, birth_date, diagnosis,
          icd_code, notes, created_at)

-- Doktorlar profili
doctors (id, user_id, specialization, clinic, phone)

-- Ota-onalar profili
parents (id, user_id, child_id, phone, relation)

-- Kunlik hisobotlar (ota-onadan)
reports (id, child_id, parent_id, report_date, mood_score,
         speech_notes, behavior_notes, sleep_hours,
         appetite, tasks_completed, ai_summary, created_at)

-- Terapiya sessiyalari
sessions (id, child_id, doctor_id, scheduled_at,
          duration_minutes, status, notes, created_at)

-- Chat xabarlari
messages (id, sender_id, receiver_id, child_id,
          content, is_read, created_at)

-- O'yin natijalari
game_sessions (id, child_id, game_id, score,
               correct_answers, difficulty_level,
               ai_adjustment, started_at, ended_at)

-- O'yinlar katalogi
games (id, title, category, min_age, max_age,
       difficulty_range, description)

-- AI tahlil natijalari
ai_analyses (id, child_id, analysis_type,
             input_data, result, confidence, created_at)

-- Bildirishnomalar
notifications (id, user_id, title, body, type,
               is_read, created_at)
```

### Rollar tizimi (RBAC)
```
super_admin  → Hamma narsaga kirish
admin        → Faqat o'z shifoxonasi
doctor       → Faqat o'z bemorlar
parent       → Faqat o'z bola
child        → Faqat o'yinlar
```

---

## 🔌 API ENDPOINTLAR

### Auth
```
POST /api/auth/register     ← Ro'yxatdan o'tish
POST /api/auth/login        ← Kirish
POST /api/auth/logout       ← Chiqish
GET  /api/auth/me           ← Profil ko'rish
```

### Bolalar
```
GET    /api/children              ← Ro'yxat (doktor uchun)
POST   /api/children              ← Yangi bola qo'shish
GET    /api/children/:id          ← Bitta bola profili
PUT    /api/children/:id          ← Profilni yangilash
GET    /api/children/:id/progress ← Rivojlanish statistikasi
DELETE /api/children/:id          ← Profilni o'chirish
```

### Hisobotlar
```
POST /api/reports           ← Yangi hisobot (ota-ona)
GET  /api/reports/:id       ← Bitta hisobot
GET  /api/reports/child/:id ← Bola hisobotlari ro'yxati
```

### Sessiyalar
```
GET  /api/sessions          ← Jadval
POST /api/sessions          ← Yangi sessiya
PUT  /api/sessions/:id      ← Yangilash
```

### Chat
```
GET  /api/messages/:childId ← Xabarlar tarixi
POST /api/messages          ← Xabar yuborish
```

### AI
```
POST /api/ai/analyze-report ← Hisobotni tahlil qilish
POST /api/ai/chat           ← Chatbot (ota-ona uchun)
POST /api/ai/game-adjust    ← O'yin qiyinligini moslashtirish
```

### O'yinlar
```
GET  /api/games             ← O'yinlar katalogi
POST /api/games/session     ← Sessiya natijasini saqlash
GET  /api/games/child/:id   ← Bola o'yin statistikasi
```

---

## 🤖 AI INTEGRATSIYA

### Claude API ishlatish usuli

```typescript
// src/services/ai.service.ts

import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Hisobot tahlili
export async function analyzeReport(reportData: object) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: `Sen tibbiy mutaxassis yordamchisan.
      Quyidagi bola rivojlanish hisobotini tahlil qil
      va doktorga qisqacha xulosa ber:
      ${JSON.stringify(reportData)}`
    }]
  });
  return response.content[0].text;
}

// Ota-ona chatbot
export async function parentChatbot(
  question: string,
  childInfo: object
) {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 800,
    system: `Sen NeuroCare tibbiy platformasining yordamchi
    chatbotisan. Ota-onalarga bolalarining rivojlanishi haqida
    maslahat berasan. Doim oxirida "Bu haqida doktoringiz
    bilan maslahatlashing" deb qo'sh. Bola ma'lumotlari:
    ${JSON.stringify(childInfo)}`,
    messages: [{role: "user", content: question}]
  });
  return response.content[0].text;
}
```

### AI qoidalari
- AI hech qachon rasmiy tashxis qo'ymaydi
- Har AI javobi "doktor bilan maslahatlashing" eslatmasi bilan
- AI natijalari "Tavsiya" deb belgilanadi, "Tashxis" emas
- Bolalar ma'lumotlari AI ga minimal hajmda yuboriladi

---

## 🔐 XAVFSIZLIK QOIDALARI

```
1. Barcha parollar bcrypt bilan hash qilinadi
2. JWT token 7 kun amal qiladi
3. Refresh token 30 kun
4. Har endpoint auth middleware orqali o'tadi
5. RBAC — har rol faqat o'z ma'lumotiga kiradi
6. Rate limiting — 100 req/min per IP
7. HTTPS majburiy (Vercel avtomatik beradi)
8. .env fayli hech qachon GitHub ga yuklanmaydi
9. SQL injection — Supabase parameterized queries
10. XSS — React avtomatik himoya
```

---

## 🚦 MVP REJASI

### Hozirgi holat
```
✅ Faza 0 — Toollar o'rnatildi
   Node.js, VSCode, GitHub, Supabase, Vercel tayyor

✅ Faza 1 — Backend (TO'LIQ TAYYOR!)
    Express server, Auth tizimi, DB jadvallar
    ✅ 1-kun: Toollar o'rnatildi
    ✅ 2-kun: Express server + papka tuzilmasi
    ✅ 3-kun: Supabase + 11 ta jadval
    ✅ 4-kun: Auth tizimi (register/login/logout/getMe)
    ✅ 5-kun: Children API + xato boshqarish
    ✅ 6-kun: Reports API + Claude AI tahlil
    ✅ 7-kun: Messages + Socket.IO real-time chat
    ✅ 8-kun: AI Service to'liq (chatbot, hisobot, o'yin)
    ✅ 9-kun: Sessions API + eslatma tizimi

🔄 Faza 2 — Frontend (keyingi)
  ⏳ React setup + Router
  ⏳ Doktor dashboard
  ⏳ Ota-ona panel
  ⏳ Bola o'yinlari
```

### MVP da bo'lmaydi (keyinroq)
```
❌ Video qo'ng'iroq
❌ Admin / Super Admin panel
❌ To'lov tizimi
❌ Mobile app
❌ Ko'p tilli qo'llab-quvvatlash
```

---

## 📋 HAR KUN ISHLASH TARTIBI

### Yangi sessiya boshida (har doim)
1. Bu faylni AI agentga ber
2. Qaysi fazada ekanligini ayt
3. Kechagi to'xtagan joyni ayt

### Yangi vazifa olishda
1. Kichik-bo'lakka bo'l
2. Birinchi bo'lakni so'ra
3. Test qil
4. Keyingisiga o't

### Xato chiqsa
1. Butun xato matnini ko'chir
2. Qaysi faylda ekanligini ayt
3. Nimani qilmoqchi eganingni ayt

---

## 💬 PROMPT SHABLONLARI

### Yangi kod so'rash
```
Kontekst: NeuroCare MVP, Faza [N].
Stack: Node.js + Express + TypeScript + Supabase.
Vazifa: [NIMA KERAK]
Cheklov: [BO'LSA]
Natija: Ishlaydigan, copy-paste qilib bo'ladigan kod.
```

### Xato tuzatish
```
Kontekst: NeuroCare MVP, [FAYL NOMI].
Xato: [XATO MATNI]
Kod: [MUAMMOLI KOD]
Nima qilmoqchi edim: [MAQSAD]
Xatoni tushuntir va tuzat.
```

### Tushuntirish so'rash
```
NeuroCare loyihasida [MAVZU] qanday ishlaydi?
Oddiy tilda tushuntir, kod misol bilan ko'rsat.
```

---

## 📞 MUHIM ESLATMALAR

> Bu loyiha tibbiy ma'lumotlar bilan ishlaydi.
> Xavfsizlikka alohida e'tibor ber.

> Yolg'iz ishlaydigan dasturchi uchun qurilmoqda.
> Har doim oddiy, tushinarli yechim tanlang.

> MVP — imkon qadar sodda va tez.
> Murakkablikni keyinga qoldiring.

> Har hafta bitta faza. Shoshilmang, lekin to'xtamang.

---

*NeuroCare Platform | MVP v1.0 | 2025*
*Bu fayl tirik hujjat — har yangi faza boshida yangilanadi*
