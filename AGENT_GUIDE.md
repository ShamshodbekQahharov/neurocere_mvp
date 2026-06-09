
# 🤖 NEUROCARE — AI AGENT QO'LLANMASI
# Claude Code uchun loyiha konteksti

> Bu faylni har yangi terminal sessiyasida Claude Code ga bering:
> `claude` → `/read AGENT_GUIDE.md` yoki chat boshida paste qiling

---

## 🏥 LOYIHA HAQIDA

**NeuroCare** — autizm, ZRR, ZPRR, SDVG va boshqa
neyrorivoj xususiyatlari bo'lgan bolalarni kuzatish,
davolash va rivojlantirishga mo'ljallangan kompleks
veb platforma.

### Ilovalar:
- **Ilova 1:** Doktor panel (Web)
- **Ilova 2:** Ota-ona panel (Web)
- **Ilova 3:** Bola o'yinlari (Web/Tablet)

Barchasi bitta backend API va bitta PostgreSQL DB.

---

## ⚙️ TEXNOLOGIYALAR

```
Backend:   Node.js + Express + TypeScript
Database:  PostgreSQL via Supabase
Auth:      Supabase Auth + JWT
Real-time: Socket.IO
Frontend:  React 18 + TypeScript + Tailwind CSS
AI:        Claude API (claude-sonnet-4-20250514)
Deploy:    Render.com (backend) + Vercel (frontend)
```

---

## 🌐 MUHIM URL LAR

```
Frontend (Vercel):  https://neurocere-mvp.vercel.app
Backend (Render):   https://[render-url].onrender.com
Supabase:           https://[project].supabase.co
GitHub:             https://github.com/ShamshodbekQahharov/neurocere_mvp
```

---

## 📁 LOYIHA TUZILMASI

```
neurocere_mvp/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── supabase.ts       ← Supabase client
│   │   │   └── socket.ts         ← Socket.IO config
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── children.controller.ts
│   │   │   ├── reports.controller.ts
│   │   │   ├── sessions.controller.ts
│   │   │   ├── messages.controller.ts
│   │   │   ├── ai.controller.ts
│   │   │   ├── invite.controller.ts  ← YANGI (1-hafta)
│   │   │   └── notifications.controller.ts
│   │   ├── middleware/
│   │   │   ├── auth.middleware.ts
│   │   │   └── rateLimit.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── children.routes.ts
│   │   │   ├── reports.routes.ts
│   │   │   ├── sessions.routes.ts
│   │   │   ├── messages.routes.ts
│   │   │   ├── ai.routes.ts
│   │   │   ├── games.routes.ts
│   │   │   ├── invite.routes.ts      ← YANGI (1-hafta)
│   │   │   └── notifications.routes.ts
│   │   ├── services/
│   │   │   ├── ai.service.ts
│   │   │   └── reminder.service.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   └── index.ts                  ← Express server
│   ├── scripts/
│   │   └── create-test-users.ts
│   ├── .env                          ← GITDA YO'Q
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── src/
│   │   ├── apps/
│   │   │   ├── doctor/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── DashboardPage.tsx
│   │   │   │   │   ├── ChildrenPage.tsx     ← invite form bor
│   │   │   │   │   ├── ChildDetailPage.tsx  ← YANGI (1-hafta)
│   │   │   │   │   ├── ReportsPage.tsx
│   │   │   │   │   ├── SessionsPage.tsx
│   │   │   │   │   └── ChatPage.tsx
│   │   │   │   └── DoctorApp.tsx
│   │   │   ├── parent/
│   │   │   │   ├── pages/
│   │   │   │   │   ├── ParentDashboardPage.tsx
│   │   │   │   │   ├── ParentReportFormPage.tsx
│   │   │   │   │   ├── ProgressPage.tsx
│   │   │   │   │   ├── ParentChatPage.tsx
│   │   │   │   │   └── LearnPage.tsx
│   │   │   │   └── ParentApp.tsx
│   │   │   └── child/
│   │   │       ├── games/
│   │   │       │   ├── WordMatchGame.tsx
│   │   │       │   ├── MemoryGame.tsx
│   │   │       │   └── SortingGame.tsx
│   │   │       ├── pages/
│   │   │       │   ├── GameMenuPage.tsx
│   │   │       │   ├── GamePage.tsx
│   │   │       │   └── ResultPage.tsx
│   │   │       └── ChildApp.tsx
│   │   ├── components/
│   │   │   ├── layout/
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   └── Header.tsx
│   │   │   └── ui/
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       ├── Card.tsx
│   │   │       ├── Modal.tsx
│   │   │       ├── Badge.tsx
│   │   │       ├── ProgressBar.tsx
│   │   │       └── LoadingSpinner.tsx
│   │   ├── services/
│   │   │   ├── api.ts              ← Axios instance
│   │   │   └── socket.ts           ← Socket.IO client
│   │   ├── store/
│   │   │   └── authStore.ts        ← Zustand
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   └── useChildId.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   └── NotFoundPage.tsx
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   ├── vercel.json
│   ├── .env.production
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── package.json
│
├── database/
│   └── schema.sql
├── AGENT_GUIDE.md                    ← BU FAYL
└── README.md
```

---

## 🗄️ DATABASE JADVALLARI (11 ta)

```sql
users         ← Barcha foydalanuvchilar (role bilan)
children      ← Bola profili + child_user_id + parent_user_id
doctors       ← Doktor profili
parents       ← Ota-ona profili + child bog'liqlik
reports       ← Kunlik hisobotlar
sessions      ← Terapiya sessiyalari
messages      ← Chat xabarlari
games         ← O'yinlar katalogi
game_sessions ← O'yin natijalari
notifications ← Bildirishnomalar
ai_analyses   ← Claude AI tahlil natijalari
invitations   ← YANGI: Doctor invite tizimi
```

---

## 🔌 API ENDPOINTLAR (31 ta)

### Auth (4)
```
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Children (6)
```
GET    /api/children
POST   /api/children
GET    /api/children/:id
PUT    /api/children/:id
DELETE /api/children/:id
GET    /api/children/:id/progress
```

### Reports (4)
```
POST /api/reports
GET  /api/reports/:id
GET  /api/reports/child/:childId
GET  /api/reports/child/:childId/stats
```

### Sessions (6)
```
GET  /api/sessions
POST /api/sessions
GET  /api/sessions/:id
PUT  /api/sessions/:id
GET  /api/sessions/upcoming
GET  /api/sessions/stats/:childId
```

### Messages (4)
```
GET  /api/messages
POST /api/messages
PUT  /api/messages/:id/read
GET  /api/messages/unread-count
```

### AI (3)
```
POST /api/ai/chatbot
GET  /api/ai/analyses
POST /api/ai/game-adjust
```

### Games (4)
```
GET  /api/games
POST /api/games/session
GET  /api/games/sessions
GET  /api/games/child/:childId
```

### Notifications (2)
```
GET /api/notifications
PUT /api/notifications/:id/read
```

### Invite — YANGI (3)
```
POST /api/invite              ← 3 ta akkant yaratish
GET  /api/invite              ← Invite ro'yxati
POST /api/invite/reset-password ← Parol yangilash
```

---

## 🔐 ROLLAR TIZIMI

```
super_admin  → Hamma narsaga kirish
admin        → Shifoxona boshqaruvi
doctor       → O'z bemorlar
parent       → O'z bola
child        → Faqat o'yinlar
```

---

## 📊 HOZIRGI HOLAT

### ✅ Tayyor (MVP):
- Auth tizimi (register/login/logout)
- Children API (CRUD + progress)
- Reports API + Claude AI tahlil
- Messages API + Socket.IO real-time chat
- Sessions API + reminder service
- AI Service (chatbot + report analysis + game)
- Games API (3 ta o'yin)
- Notifications tizimi
- Doktor panel UI (to'liq)
- Ota-ona panel UI (to'liq)
- Bola o'yinlari UI (3 ta o'yin)
- Deploy: Render + Vercel

### 🔄 1-Hafta vazifalari (hozir):
**Parallel A — Doctor Invite Tizimi:**
- [ ] invite.controller.ts — createChildWithAccounts
- [ ] invite.routes.ts — 3 ta endpoint
- [ ] ChildrenPage.tsx — yangi forma (3 bo'lim)
- [ ] Natija modali — login ma'lumotlari + clipboard

**Parallel B — O'yin Natijalari Integratsiya:**
- [ ] game_sessions — bildirishnoma trigger
- [ ] Socket.IO — join_user_room + getSocketInstance
- [ ] Doctor Dashboard — bugungi o'yin natijalari
- [ ] Parent Dashboard — farzand o'yinlari bo'limi
- [ ] ChildDetailPage.tsx — o'yin grafigi

---

## ⚠️ MUHIM QOIDALAR

### Kod yozishda:
```
1. TypeScript strict mode — doim
2. O'zbek apostrofi JSX ichida:
   ❌ 'O'rtacha'
   ✅ "O'rtacha"
3. supabaseAdmin ishlatish (anon emas)
4. Har controller try-catch bilan
5. Har endpoint authenticate middleware
```

### Git:
```
Commit format:
feat: yangi funksiya
fix: xato tuzatish
refactor: kodni yaxshilash

Hech qachon .env commit qilma!
```

### Build:
```bash
# Backend test:
cd backend && npm run build

# Frontend test:
cd frontend && npm run build

# Ikkalasi xatosiz bo'lishi shart!
```

---

## 🚨 TEZKOR XATOLAR VA YECHIMLARI

| Xato | Yechim |
|------|--------|
| `O'zbek apostrofi` | Single → double quote |
| `@types/socket.io` | package.json dan o'chir |
| `export default yo'q` | App.tsx oxiriga qo'sh |
| `CORS blocked` | FRONTEND_URL env var |
| `401 Unauthorized` | supabaseAdmin ishlatish |
| `500 game sessions` | JOIN query tuzatish |

---

## 🔧 ENV VARIABLES

```bash
# backend/.env
PORT=5000
NODE_ENV=development
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
JWT_EXPIRES_IN=7d
ANTHROPIC_API_KEY=
FRONTEND_URL=https://neurocere-mvp.vercel.app
```

---

## 📋 CLAUDE CODE UCHUN TEZKOR BUYRUQLAR

```bash
# Loyihani o'qish:
/read AGENT_GUIDE.md

# Backend build:
cd backend && npm run build

# Frontend build:
cd frontend && npm run build

# Barcha fayllarni ko'rish:
ls backend/src/controllers/
ls frontend/src/apps/

# Xatoni topish:
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

---

*NeuroCare Platform | v1.0 MVP + 1-hafta rivojlantirish*
*Oxirgi yangilanish: 2025*
*Bu fayl tirik hujjat — har yangi faza boshida yangilanadi*
