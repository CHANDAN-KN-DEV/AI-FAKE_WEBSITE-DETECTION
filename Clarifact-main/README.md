# 🤖 Clarifact - AI Fake News Detector

**Stop fake news in its tracks!** 🚫📰

A platform built for everyday users and verified authority reviewers. Users can submit claims or post issues in the community, AI analyzes them, and trusted authorities decide if important news is fake or real.

---

## 🎯 What's the Problem?

Fake news spreads like wildfire on social media, WhatsApp, and the internet. Traditional fact-checking is slow and often biased. Clarifact gives community contributors fast AI guidance plus an authority review path so urgent or high-risk stories get official oversight.

---

## 🚀 How It Works

### 1. 📝 Submit Claims & Community Posts
Users can submit:
- ✍️ Text messages
- 🔗 URLs and articles
- 📱 WhatsApp messages
- 🖼️ Images and videos
- 🎵 Audio files

Community members can also post news or concerns for review.

### 2. 🧠 AI Analysis
Our system uses multiple AI providers simultaneously:
- 🤖 **Gemini** (Google AI)
- 🚀 **Grok** (xAI)
- 📖 **Jina AI** (content reader)
- 🌐 **OpenRouter** (368+ AI models)

Each AI scores truthfulness, detects manipulation, and checks sources.

### 3. 👥 Community Voting
Registered users vote: ✅ TRUE / ❌ FALSE / ⚠️ MISLEADING

### 4. ⚖️ Smart Consensus
Final score combines:
- **35%** 🤖 AI Analysis
- **35%** 👥 Community Votes
- **20%** 🏢 Source Credibility
- **10%** 🚨 Authority Review

When a claim is flagged as high-risk or likely fake, the system sends it to the authority queue for official review.

### 5. 🛂 Authority Verification
Authorities sign up through a verification page where they upload government ID and proof. Once verified, they receive an authority account and can cast official verdicts on important community content.

### 6. 📚 Corrections & Learning
Get fact-based corrections for false claims.

### 7. 📊 Dashboard
See trending fake news, regional patterns, and your verification history.

---

## 🛠️ Tech Stack

### Backend
- ⚡ **Node.js** ≥18
- 🌐 **Express.js** + TypeScript
- 🗄️ **SQLite** (default local dev) + Prisma ORM
- 🗄️ **PostgreSQL** supported for production
- 🔄 **Redis** (optional background jobs)
- 🔐 **JWT Authentication**
- 📖 **Swagger API Docs**

### AI Partners
- 🤖 Google Gemini
- 🚀 xAI Grok
- 📖 Jina AI
- 🌐 OpenRouter

---

## � Project Structure

```
.
├─ backend/
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ prisma/
│  │  ├─ schema.prisma
│  │  └─ migrations/
│  └─ src/
│     ├─ app.ts
│     ├─ server.ts
│     ├─ config/
│     ├─ controllers/
│     ├─ integrations/
│     ├─ jobs/
│     ├─ middleware/
│     ├─ providers/
│     ├─ routes/
│     ├─ services/
│     ├─ types/
│     └─ utils/
├─ frontend/
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ vite.config.ts
│  └─ src/
│     ├─ App.tsx
│     ├─ main.tsx
│     ├─ router.tsx
│     ├─ components/
│     │  ├─ auth/
│     │  ├─ common/
│     │  ├─ community/
│     │  ├─ dashboard/
│     │  ├─ inputs/
│     │  ├─ layout/
│     │  └─ results/
│     ├─ hooks/
│     ├─ i18n/
│     ├─ lib/
│     ├─ pages/
│     ├─ services/
│     ├─ store/
│     ├─ styles/
│     └─ types/
├─ mobile/
│  ├─ package.json
│  ├─ app.json
│  └─ src/
│     ├─ App.tsx
│     └─ index.ts
├─ knip.jsonc
├─ package.json
├─ README.md
└─ ralph-purge.ps1
```

---

## �📋 Prerequisites

| Tool | Version | Download |
|---|---|---|
| **Node.js** | ≥ 18 | https://nodejs.org |
| **SQLite** | built-in | https://www.sqlite.org |
| **PostgreSQL** | ≥ 14 *(optional)* | https://www.postgresql.org/download/windows/ |
| **Redis** | ≥ 7 *(optional)* | https://github.com/tporadowski/redis/releases |

> 💡 Local development uses SQLite by default. PostgreSQL is supported and can be enabled via `backend/.env.example`.

---

## 🚀 Quick Start

### 1. 📦 Install Dependencies
```powershell
cd backend
npm install
```

### 2. ⚙️ Setup Environment
Edit `.env` in the `backend/` folder:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# Optional: use PostgreSQL instead by copying backend/.env.example
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clarifact?schema=public"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Security
JWT_SECRET="your-secret-key-here"

# AI Keys (optional - uses mock if missing)
GEMINI_API_KEY="your-key"
GROK_API_KEY="your-key"
JINA_API_KEY="your-key"
OPENROUTER_API_KEY="your-key"

PORT=4000
NODE_ENV=development
```

### 3. 🗄️ Setup Database
```powershell
# For local SQLite development, no external database server is required.
# Prisma will create the SQLite file automatically when migrations run.

npx prisma generate
npx prisma migrate dev --name init
```

> If you want PostgreSQL instead, use `backend/.env.example` and create the database as described there.

### 4. ▶️ Start Server
```powershell
npm run dev
```

🎉 **Server runs at: http://localhost:4000**

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot-reload |
| `npm run test:api` | Run full API + API key test suite |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Start compiled production build |
| `npx prisma generate` | Regenerate Prisma client after schema changes |
| `npx prisma migrate dev` | Create and apply new migration |
| `npx prisma studio` | Open visual DB editor at http://localhost:5555 |

---

## 📖 API Documentation

Visit `http://localhost:4000/docs` for interactive API docs!

---

## 🧪 Testing

Run the full test suite:
```powershell
npm run test:api
```

---

## 🐳 Docker Setup (Easy Way)

```powershell
# Start database services
docker compose up -d

# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma migrate dev --name init

# Start server
npm run dev
```

---

## 🔧 Available Commands

| Command | What it does |
|---|---|
| `npm run dev` | 🚀 Start development server |
| `npm run build` | 📦 Build for production |
| `npm start` | ▶️ Run production build |
| `npm run test:api` | ✅ Run API tests |
| `npx prisma studio` | 🗄️ Open database editor |

---

## 🆘 Need Help?

### Database Connection Issues
```powershell
# Check if PostgreSQL is running
Get-Service -Name "postgresql*"

# Start it
Start-Service -Name "postgresql-x64-16"
```

### Port Already in Use
```powershell
# Find process using port 4000
netstat -ano | findstr :4000
taskkill /PID <pid> /F
```

### Redis Warnings (Safe to ignore)
Redis is optional. Warnings about Redis mean background jobs are disabled - that's fine!

---

## 🎯 Key Features

- 🤖 **Multi-AI Analysis** - 4+ AI providers working together
- 👥 **Community Voting** - Democratic fact-checking
- 👨‍🏫 **Expert Validation** - Professional oversight
- 📊 **Real-time Dashboard** - Trending fake news insights
- 🌍 **Multi-format Support** - Text, URLs, images, audio, video
- 🔄 **Automatic Fallbacks** - If one AI fails, others take over
- 📱 **WhatsApp Integration** - Check forwarded messages
- 🎓 **Educational Corrections** - Learn from mistakes

---

## 🤝 Contributing

Found a bug or have an idea? Open an issue or submit a pull request!

---

**Made with ❤️ to fight misinformation**
