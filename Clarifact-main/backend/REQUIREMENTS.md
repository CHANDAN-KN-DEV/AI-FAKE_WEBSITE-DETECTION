# Clarifact Backend — System Requirements

## Runtime Dependencies (install these first)

### 1. Node.js >= 18
- Download: https://nodejs.org/en/download
- Verify: `node --version`

### 2. PostgreSQL 14+ (required for the DB)
- Download: https://www.postgresql.org/download/windows/
- OR use Docker (recommended, see below)
- Default connection: postgresql://postgres:postgres@localhost:5432/clarifact

### 3. Redis 7+ (optional — required only for scheduled job queue)
- Download: https://github.com/tporadowski/redis/releases (Windows port)
- OR use Docker (recommended)
- Without Redis: server starts fine but the featured-tracker cron job is disabled

---

## Quick Start with Docker (recommended)

```powershell
# Start PostgreSQL + Redis
docker compose up -d

# Install Node dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations (creates all tables)
npx prisma migrate dev --name init

# Start backend server (dev mode with hot-reload)
npm run dev

# In a separate terminal, run the API tests
npm run test:api
```

---

## Manual Setup (without Docker)

### PostgreSQL Setup
1. Install PostgreSQL 16 from https://www.postgresql.org/download/windows/
2. During installation set password to: `postgres`
3. Create the database:
   ```sql
   CREATE DATABASE clarifact;
   ```
4. Update `.env` if your credentials differ:
   ```
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/clarifact?schema=public"
   ```

### Redis Setup (Optional)
1. Download Windows port: https://github.com/tporadowski/redis/releases
2. Run: `redis-server`
3. Or disable queue by removing the `REDIS_URL` from `.env`

---

## npm Dependencies (managed via package.json)

| Package              | Version  | Purpose                        |
|----------------------|----------|--------------------------------|
| express              | ^5.1.0   | HTTP server framework          |
| @prisma/client       | ^6.16.1  | PostgreSQL ORM                 |
| prisma               | ^6.16.1  | DB schema management & CLI     |
| bcryptjs             | ^3.0.2   | Password hashing               |
| jsonwebtoken         | ^9.0.2   | JWT auth tokens                |
| axios                | ^1.12.2  | HTTP client for AI APIs        |
| zod                  | ^4.1.5   | Request schema validation      |
| bullmq               | ^5.58.5  | Queue/cron for scheduled jobs  |
| ioredis              | ^5.7.0   | Redis client                   |
| swagger-jsdoc        | latest   | OpenAPI spec generation        |
| swagger-ui-express   | latest   | Swagger UI at /docs            |
| helmet               | ^8.1.0   | Security headers               |
| cors                 | ^2.8.5   | CORS middleware                |
| morgan               | ^1.10.1  | HTTP request logging           |
| dotenv               | ^17.2.2  | .env file loading              |

---

## API Keys (configure in .env)

| Variable           | Required | Service          | Get Key At                          |
|--------------------|----------|------------------|-------------------------------------|
| GEMINI_API_KEY     | Optional | Google Gemini    | https://aistudio.google.com/apikey  |
| GROK_API_KEY       | Optional | xAI Grok / Groq  | https://console.x.ai/ or https://groq.com/ |
| JINA_API_KEY       | Optional | Jina Reader      | https://jina.ai/                    |
| OPENROUTER_API_KEY | Optional | OpenRouter       | https://openrouter.ai/keys          |

All API keys are optional — if missing, the system falls back to mock responses.

---

## Available Scripts

```powershell
npm run dev           # Start dev server with hot-reload (port 4000)
npm run test:api      # Run full API + API key test suite
npm run build         # Build TypeScript to dist/
npm run start         # Start production build
npx prisma generate   # Regenerate Prisma client after schema changes
npx prisma migrate dev # Run DB migrations
npx prisma studio     # Open Prisma Studio (visual DB editor)
```

---

## Swagger Docs

Once the server is running, visit: **http://localhost:4000/docs**

- Interactive API documentation for all 36 endpoints
- Authorize with your JWT token (click Authorize → paste Bearer token)
- Test endpoints directly from the browser
