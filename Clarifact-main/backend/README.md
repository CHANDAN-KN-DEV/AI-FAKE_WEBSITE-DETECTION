# Clarifact Backend API

AI-powered fake news detection platform for community users and verified authority reviewers. Users submit claims and community posts, AI analyzes them, and urgent or likely fake news is sent to authority reviewers for official decisions.

---

## Prerequisites

| Tool | Version | Download |
|---|---|---|
| **Node.js** | ≥ 18 | https://nodejs.org |
| **SQLite** | built-in | https://www.sqlite.org |
| **PostgreSQL** | ≥ 14 *(optional)* | https://www.postgresql.org/download/windows/ |
| **Redis** | ≥ 7 *(optional)* | https://github.com/tporadowski/redis/releases |

> Redis is optional — the server starts fine without it. It only powers the background job queue (featured tracker cron).

---

## Quick Start

### 1. Install dependencies

```powershell
cd backend
npm install
```

### 2. Configure environment

Edit **`.env`** in the `backend/` folder:

```env
# Database (SQLite local dev default)
DATABASE_URL="file:./prisma/dev.db"

# Optional: use PostgreSQL instead by copying backend/.env.example
# DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clarifact?schema=public"

# Redis (optional — queue features)
REDIS_URL="redis://localhost:6379"

# Auth
JWT_SECRET="change-me-to-a-long-random-secret"

# AI Provider Keys (all optional — falls back to mock if missing)
GEMINI_API_KEY=""       # https://aistudio.google.com/apikey
GROK_API_KEY=""         # https://console.x.ai  (must start with xai-)
JINA_API_KEY=""         # https://jina.ai
OPENROUTER_API_KEY=""   # https://openrouter.ai/keys

PORT=4000
NODE_ENV=development
```

### 3. Set up the database

```powershell
# For local SQLite development, no external database server is required.
# Prisma will create the SQLite file automatically when migrations run.

npx prisma generate
npx prisma migrate dev --name init
```

> If you want PostgreSQL instead, use `backend/.env.example` and create the database as described there.

### 4. Start the server

```powershell
npm run dev
```

Server runs at **http://localhost:4000**

Authority verification is handled through the platform upload flow; verified authority accounts can review important flagged news and cast official verdicts.

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

## API Docs (Swagger UI)

Once the server is running, visit:

```
http://localhost:4000/docs
```

- Browse all **36 endpoints** interactively
- Click **Authorize** → paste your JWT token (`Bearer <token>`)
- Test any endpoint directly in the browser

Raw OpenAPI spec: `http://localhost:4000/docs.json`

---

## API Key Status

| Provider | Status | Notes |
|---|---|---|
| **Gemini** (`AIzaSy...`) | ⚠️ Free quota exhausted | Add billing at https://aistudio.google.com |
| **Grok/xAI** (`xai-...`) | ⚠️ No credits | Purchase at https://console.x.ai |
| **Jina** | ✅ Working | URL content reader |
| **OpenRouter** | ✅ Working | Active fallback — 368 models available |

> All keys are optional. When a provider fails, the system automatically falls back to the next available one. OpenRouter is the final fallback before mock data.

---

## Endpoint Reference

### Auth
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | ❌ | Register new user |
| POST | `/api/auth/login` | ❌ | Login, receive JWT |
| GET | `/api/auth/me` | ✅ | Get current user |
| POST | `/api/auth/logout` | ✅ | Logout |

### Claims
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/claims/submit` | ✅ | Submit claim (`contentType`: text/url/whatsapp/image/video/voice) |
| GET | `/api/claims/history` | ✅ | Get your claims |
| GET | `/api/claims/:id` | ✅ | Get claim by ID |

### AI Analysis
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/analyze-text` | ✅ | Analyze raw text |
| POST | `/api/ai/analyze-url` | ✅ | Analyze URL content (via Jina) |
| POST | `/api/ai/analyze-media` | ✅ | Multimodal (501 — coming soon) |
| POST | `/api/ai/extract-claims` | ✅ | Extract sub-claims from a claim |
| POST | `/api/ai/emotional-manipulation` | ✅ | Score fear/anger/urgency/etc |
| POST | `/api/ai/source-score` | ✅ | Score source credibility |
| POST | `/api/ai/provider-compare` | ✅ | Compare all AI providers in parallel |

### Community & Consensus
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/community/vote` | ✅ | Vote TRUE / FALSE / MISLEADING |
| GET | `/api/community/votes/:claimId` | ✅ | Get votes for a claim |
| GET | `/api/consensus/:claimId` | ✅ | Get consensus score |
| POST | `/api/consensus/recalculate/:claimId` | ✅ | Recalculate (0.45×AI + 0.40×Community + 0.15×Source) |

### Experts & Admin
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/experts/apply` | ✅ | Apply for expert status |
| GET | `/api/experts/me` | ✅ | Your application status |
| GET | `/api/admin/expert-applications` | 🔐 Admin | List pending applications |
| POST | `/api/admin/experts/:id/approve` | 🔐 Admin | Approve expert |
| POST | `/api/admin/experts/:id/reject` | 🔐 Admin | Reject expert |

### Dashboard & More
| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/dashboard/top-picks` | ✅ | Top featured fake-news picks |
| GET | `/api/dashboard/trending` | ✅ | Trending today |
| GET | `/api/dashboard/categories` | ✅ | Category-wise stats |
| GET | `/api/dashboard/regions` | ✅ | Region-wise stats |
| GET | `/api/dashboard/alerts` | ✅ | Your alerts |
| GET | `/api/featured/history` | ✅ | Featured item history |
| POST | `/api/corrections/generate` | ✅ | Generate correction for claim |
| GET | `/api/corrections/:claimId` | ✅ | Get correction |
| POST | `/api/i18n/translate` | ✅ | Translate text |
| POST | `/api/i18n/transcribe` | ✅ | Transcribe audio URL |

---

## Running Tests

Make sure the server is running first (`npm run dev`), then in a new terminal:

```powershell
npm run test:api
```

**What it tests (42 checks):**
- ✅ API key validation (Gemini, Grok, Jina, OpenRouter)
- ✅ Full auth flow (register → login → me → logout)
- ✅ Claims CRUD
- ✅ All 7 AI endpoints
- ✅ Community voting
- ✅ Expert application flow
- ✅ Consensus engine
- ✅ Corrections generation
- ✅ All 5 dashboard endpoints
- ✅ i18n translate + transcribe
- ✅ Auth guards (401 on all protected routes)
- ✅ Swagger UI + OpenAPI spec (36 paths)

---

## Project Structure

```
backend/
├── src/
│   ├── app.ts                  # Express app factory
│   ├── server.ts               # Entry point, port binding
│   ├── config/
│   │   ├── env.ts              # Typed env vars
│   │   ├── prisma.ts           # Prisma client singleton
│   │   ├── redis.ts            # Redis client (graceful fallback)
│   │   └── swagger.ts          # Swagger/OpenAPI setup
│   ├── controllers/            # Route handlers
│   ├── services/               # Business logic
│   ├── providers/              # AI provider adapters (Gemini, Grok, Jina, OpenRouter)
│   ├── routes/                 # Express routers
│   ├── middleware/             # Auth, error, rate-limit
│   ├── jobs/                   # Background jobs (BullMQ)
│   ├── swagger-docs.ts         # OpenAPI JSDoc definitions
│   └── test-api.ts             # Full API test suite
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── migrations/             # Auto-generated SQL migrations
├── docker-compose.yml          # PostgreSQL + Redis via Docker
├── REQUIREMENTS.md             # Detailed system requirements
└── .env                        # Environment variables (do not commit)
```

---

## Docker (Alternative DB Setup)

If you have Docker installed:

```powershell
# Start PostgreSQL + Redis
docker compose up -d

# Then run migrations
npx prisma migrate dev --name init

# Start server
npm run dev
```

---

## Troubleshooting

**`Can't reach database server at localhost:5432`**
```powershell
# Check if PostgreSQL is running
Get-Service -Name "postgresql*"

# Start it if stopped
Start-Service -Name "postgresql-x64-16"
```

**`Connection is closed` (Redis errors in logs)**  
Redis is not installed — this is safe to ignore. The server works without it. The warning `[Queue] Featured tracker skipped (Redis unavailable)` is expected.

**`npx prisma generate` needed after pulling changes**  
Always regenerate the Prisma client if `schema.prisma` changes:
```powershell
npx prisma generate
```

**Port 4000 already in use**
```powershell
# Find and kill the process
netstat -ano | findstr :4000
taskkill /PID <pid> /F
```
