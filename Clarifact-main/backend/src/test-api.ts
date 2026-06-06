#!/usr/bin/env ts-node
/**
 * Clarifact API Test Suite
 * Tests all API keys (Gemini, Grok, Jina, OpenRouter) and all endpoints via HTTP.
 * 
 * Usage:
 *   npx ts-node src/test-api.ts
 *   OR after server is running:
 *   npx ts-node src/test-api.ts --skip-start
 */

import axios, { AxiosError } from "axios";
import * as dotenv from "dotenv";

dotenv.config();

const BASE = `http://localhost:${process.env.PORT ?? 4000}`;
const ENV = process.env;

// ─── Colours ─────────────────────────────────────────────────────────────────

const GREEN  = "\x1b[32m";
const RED    = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN   = "\x1b[36m";
const BOLD   = "\x1b[1m";
const RESET  = "\x1b[0m";

let passed = 0, failed = 0, warned = 0;

function ok(label: string, msg = "") {
  passed++;
  console.log(`  ${GREEN}✔${RESET} ${label}${msg ? ` — ${msg}` : ""}`);
}

function fail(label: string, err: string) {
  failed++;
  console.log(`  ${RED}✘${RESET} ${label} — ${RED}${err}${RESET}`);
}

function warn(label: string, msg: string) {
  warned++;
  console.log(`  ${YELLOW}⚠${RESET} ${label} — ${YELLOW}${msg}${RESET}`);
}

function section(title: string) {
  console.log(`\n${BOLD}${CYAN}━━━ ${title} ━━━${RESET}`);
}

// ─── HTTP Helpers ─────────────────────────────────────────────────────────────

async function get(path: string, token?: string) {
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return axios.get(`${BASE}${path}`, { headers, validateStatus: () => true });
}

async function post(path: string, data: unknown, token?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return axios.post(`${BASE}${path}`, data, { headers, validateStatus: () => true });
}

// ─── 1. Server Health ────────────────────────────────────────────────────────

async function testHealth() {
  section("1. Server Health");
  try {
    const res = await get("/health");
    if (res.status === 200 && res.data.ok) ok("GET /health");
    else fail("GET /health", `status ${res.status}`);
  } catch (e: any) {
    fail("GET /health", `Cannot connect to server at ${BASE} — is it running?`);
    throw new Error("Server not reachable — aborting remaining tests.");
  }

  try {
    const res = await get("/api/");
    if (res.status === 200) ok("GET /api/ (root)");
    else fail("GET /api/", `status ${res.status}`);
  } catch {
    fail("GET /api/", "request failed");
  }
}

// ─── 2. API Key Tests ─────────────────────────────────────────────────────────

async function testApiKeys() {
  section("2. API Key Validation");

  // ── Gemini ──────────────────────────────────────────────────────────────
  const geminiKey = ENV.GEMINI_API_KEY;
  if (!geminiKey) {
    warn("Gemini API Key", "GEMINI_API_KEY not set — AI calls will use mock");
  } else {
    try {
      const resp = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
        { contents: [{ role: "user", parts: [{ text: "Say OK in 2 words." }] }] },
        { timeout: 15000 }
      );
      if (resp.status === 200 && resp.data?.candidates?.[0]?.content) {
        ok("Gemini API Key", `✓ model=gemini-2.0-flash responded`);
      } else {
        fail("Gemini API Key", `unexpected response: ${resp.status}`);
      }
    } catch (e: any) {
      const msg: string = e?.response?.data?.error?.message ?? e.message ?? "";
      // Treat quota exceeded as a warning, not a hard failure
      if (msg.includes("quota") || msg.includes("Quota") || msg.includes("rate") || e?.response?.status === 429) {
        warn("Gemini API Key", `Rate/quota limit hit — ${msg.slice(0, 120)}`);
      } else {
        fail("Gemini API Key", msg);
      }
    }
  }

  // ── Grok (xAI) ──────────────────────────────────────────────────────────
  const grokKey = ENV.GROK_API_KEY;
  if (!grokKey) {
    warn("Grok API Key", "GROK_API_KEY not set — calls will use mock");
  } else {
    const isGroqKey = grokKey.startsWith("gsk_");
    const endpoint = isGroqKey
      ? "https://api.groq.com/openai/v1/chat/completions"
      : "https://api.x.ai/v1/chat/completions";
    const model = isGroqKey ? "llama-3.1-8b-instant" : "grok-3-mini-fast";

    try {
      const resp = await axios.post(
        endpoint,
        {
          model,
          messages: [{ role: "user", content: "Reply with just: OK" }],
          max_tokens: 5
        },
        {
          headers: { Authorization: `Bearer ${grokKey}`, "Content-Type": "application/json" },
          timeout: 20000
        }
      );

      const message =
        resp.data?.choices?.[0]?.message?.content ??
        resp.data?.output?.[0]?.content?.[0]?.text ??
        resp.data?.output?.[0]?.content;

      if (resp.status === 200 && message) {
        ok("Grok API Key", `✓ model responded (${isGroqKey ? "Groq" : "xAI"})`);
      } else {
        fail("Grok API Key", `status ${resp.status}: ${JSON.stringify(resp.data)}`);
      }
    } catch (e: any) {
      const detail = e?.response?.data?.error ?? e?.response?.data?.message ?? e.message;
      const status = e?.response?.status ?? "network";
      warn("Grok API Key", `HTTP ${status} — ${typeof detail === "object" ? JSON.stringify(detail) : detail}`);
    }
  }

  // ── Jina ────────────────────────────────────────────────────────────────
  const jinaKey = ENV.JINA_API_KEY;
  if (!jinaKey) {
    warn("Jina API Key", "JINA_API_KEY not set — retrieval will use mock");
  } else {
    try {
      const resp = await axios.get("https://r.jina.ai/https://example.com", {
        headers: { Authorization: `Bearer ${jinaKey}` },
        timeout: 15000
      });
      if (resp.status === 200) {
        ok("Jina API Key", "✓ reader endpoint reachable");
      } else {
        fail("Jina API Key", `status ${resp.status}`);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? e.message;
      fail("Jina API Key", msg);
    }
  }

  // ── OpenRouter ──────────────────────────────────────────────────────────
  const orKey = ENV.OPENROUTER_API_KEY;
  if (!orKey) {
    warn("OpenRouter API Key", "OPENROUTER_API_KEY not set — will use mock");
  } else {
    try {
      const resp = await axios.get("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${orKey}` },
        timeout: 15000
      });
      if (resp.status === 200 && resp.data?.data?.length > 0) {
        ok("OpenRouter API Key", `✓ ${resp.data.data.length} models available`);
      } else {
        fail("OpenRouter API Key", `status ${resp.status}`);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message ?? e.message;
      fail("OpenRouter API Key", msg);
    }
  }
}

// ─── 3. Auth Endpoints ───────────────────────────────────────────────────────

let token = "";
let claimId = "";
const testEmail = `test_${Date.now()}@clarifact.local`;
const testPassword = "Password123!";

async function testAuth() {
  section("3. Auth Endpoints");

  // POST /api/auth/register
  const reg = await post("/api/auth/register", { email: testEmail, password: testPassword });
  if (reg.status === 201 && reg.data?.token) {
    ok("POST /api/auth/register", `user=${reg.data.user.id}`);
    token = reg.data.token;
  } else if (reg.status === 409) {
    warn("POST /api/auth/register", "email already registered (DB not reset) — trying login");
  } else {
    fail("POST /api/auth/register", `status ${reg.status}: ${JSON.stringify(reg.data)}`);
  }

  // POST /api/auth/login
  const login = await post("/api/auth/login", { email: testEmail, password: testPassword });
  if (login.status === 200 && login.data?.token) {
    ok("POST /api/auth/login");
    token = login.data.token; // always refresh token from login
  } else {
    fail("POST /api/auth/login", `status ${login.status}: ${JSON.stringify(login.data)}`);
  }

  if (!token) {
    fail("Auth token", "No token obtained — cannot test authenticated endpoints");
    return;
  }

  // GET /api/auth/me
  const me = await get("/api/auth/me", token);
  if (me.status === 200 && me.data?.user) {
    ok("GET /api/auth/me", `role=${me.data.user.role}`);
  } else {
    fail("GET /api/auth/me", `status ${me.status}`);
  }

  // POST /api/auth/logout
  const logout = await post("/api/auth/logout", {}, token);
  if (logout.status === 200 && logout.data?.ok) {
    ok("POST /api/auth/logout");
  } else {
    fail("POST /api/auth/logout", `status ${logout.status}`);
  }
}

// ─── 4. Claims Endpoints ─────────────────────────────────────────────────────

async function testClaims() {
  section("4. Claims Endpoints");
  if (!token) { warn("Claims", "skipped — no auth token"); return; }

  const submit = await post("/api/claims/submit", {
    title: "Test: Drinking bleach cures viruses",
    contentType: "text",
    text: "Forward this now! Urgent health alert — bleach kills all viruses IMMEDIATELY. Share before midnight!"
  }, token);

  if (submit.status === 201 && submit.data?.claim?.id) {
    claimId = submit.data.claim.id;
    ok("POST /api/claims/submit", `claimId=${claimId}`);
  } else {
    fail("POST /api/claims/submit", `status ${submit.status}: ${JSON.stringify(submit.data)}`);
  }

  const history = await get("/api/claims/history", token);
  if (history.status === 200 && history.data?.claims) {
    ok("GET /api/claims/history", `${history.data.claims.length} claims`);
  } else {
    fail("GET /api/claims/history", `status ${history.status}`);
  }

  if (claimId) {
    const detail = await get(`/api/claims/${claimId}`, token);
    if (detail.status === 200 && detail.data?.claim?.id) {
      ok("GET /api/claims/:id");
    } else {
      fail("GET /api/claims/:id", `status ${detail.status}: ${JSON.stringify(detail.data)}`);
    }
  }
}

// ─── 5. AI Endpoints ─────────────────────────────────────────────────────────

async function testAI() {
  section("5. AI Endpoints");
  if (!token) { warn("AI", "skipped — no auth token"); return; }

  // analyze-text (direct, no claimId needed)
  const at = await post("/api/ai/analyze-text", {
    text: "Scientists confirm 5G towers spread the virus through radiation"
  }, token);
  if (at.status === 200 && at.data?.result) {
    const usedMock = at.data.result.meta?.usedMock;
    ok("POST /api/ai/analyze-text", `provider=${at.data.result.meta?.provider}, mock=${usedMock}`);
    if (usedMock) warn("analyze-text", "Used mock response (API key may be invalid or rate-limited)");
  } else {
    fail("POST /api/ai/analyze-text", `status ${at.status}: ${JSON.stringify(at.data)}`);
  }

  // analyze-url
  const au = await post("/api/ai/analyze-url", {
    url: "https://example.com/fake-news-article"
  }, token);
  if (au.status === 200 && au.data?.result) {
    ok("POST /api/ai/analyze-url", `provider=${au.data.result.meta?.provider}`);
  } else {
    fail("POST /api/ai/analyze-url", `status ${au.status}`);
  }

  // analyze-media
  const am = await post("/api/ai/analyze-media", {
    mediaUrl: "https://example.com/image.jpg"
  }, token);
  if (am.status === 200 && am.data?.result) {
    ok("POST /api/ai/analyze-media", `provider=${am.data.result.meta?.provider}`);
  } else {
    fail("POST /api/ai/analyze-media", `status ${am.status}`);
  }

  if (claimId) {
    // extract-claims
    const ec = await post("/api/ai/extract-claims", { claimId }, token);
    if (ec.status === 200 && ec.data?.result) {
      ok("POST /api/ai/extract-claims", `mock=${ec.data.result.meta?.usedMock}`);
    } else {
      fail("POST /api/ai/extract-claims", `status ${ec.status}: ${JSON.stringify(ec.data)}`);
    }

    // emotional-manipulation
    const em = await post("/api/ai/emotional-manipulation", { claimId }, token);
    if (em.status === 200 && em.data?.engine) {
      ok("POST /api/ai/emotional-manipulation", `riskLabel=${em.data.engine.riskLabel}`);
    } else {
      fail("POST /api/ai/emotional-manipulation", `status ${em.status}: ${JSON.stringify(em.data)}`);
    }
  }

  // provider-compare
  const pc = await post("/api/ai/provider-compare", {
    task: "claim-extraction",
    text: "The earth is flat according to new NASA documents."
  }, token);
  if (pc.status === 200 && pc.data?.results) {
    const providers = pc.data.results.map((r: any) => r.meta?.provider).join(", ");
    ok("POST /api/ai/provider-compare", `providers=[${providers}]`);
  } else {
    fail("POST /api/ai/provider-compare", `status ${pc.status}`);
  }
}

// ─── 6. Community Endpoints ──────────────────────────────────────────────────

async function testCommunity() {
  section("6. Community Endpoints");
  if (!token || !claimId) { warn("Community", "skipped — need token + claimId"); return; }

  const vote = await post("/api/community/vote", {
    claimId,
    value: "FALSE",
    reasoning: "No scientific basis. WHO has debunked this claim thoroughly."
  }, token);
  if (vote.status === 201) {
    ok("POST /api/community/vote");
  } else {
    fail("POST /api/community/vote", `status ${vote.status}: ${JSON.stringify(vote.data)}`);
  }

  const votes = await get(`/api/community/votes/${claimId}`, token);
  if (votes.status === 200) {
    ok("GET /api/community/votes/:claimId");
  } else {
    fail("GET /api/community/votes/:claimId", `status ${votes.status}`);
  }
}

// ─── 7. Experts Endpoints ────────────────────────────────────────────────────

async function testExperts() {
  section("7. Experts Endpoints");
  if (!token) { warn("Experts", "skipped — no auth token"); return; }

  const apply = await post("/api/experts/apply", {
    category: "health",
    expertiseStatement: "I am a practicing physician with 10 years of clinical experience in infectious disease.",
    institutionEmail: "test@medical.org",
    profileUrl: "https://example.com/profile"
  }, token);
  if ([200, 201, 409].includes(apply.status)) {
    ok("POST /api/experts/apply", `status ${apply.status}`);
  } else {
    fail("POST /api/experts/apply", `status ${apply.status}: ${JSON.stringify(apply.data)}`);
  }

  const me = await get("/api/experts/me", token);
  if ([200, 404].includes(me.status)) {
    ok("GET /api/experts/me", `status ${me.status}`);
  } else {
    fail("GET /api/experts/me", `status ${me.status}`);
  }
}

// ─── 8. Consensus Endpoints ──────────────────────────────────────────────────

async function testConsensus() {
  section("8. Consensus Endpoints");
  if (!token || !claimId) { warn("Consensus", "skipped — need token + claimId"); return; }

  const recalc = await post(`/api/consensus/recalculate/${claimId}`, {}, token);
  if ([200, 201].includes(recalc.status)) {
    ok("POST /api/consensus/recalculate/:claimId");
  } else {
    fail("POST /api/consensus/recalculate/:claimId", `status ${recalc.status}: ${JSON.stringify(recalc.data)}`);
  }

  const get_c = await get(`/api/consensus/${claimId}`, token);
  if ([200, 404].includes(get_c.status)) {
    ok("GET /api/consensus/:claimId", `status ${get_c.status}`);
  } else {
    fail("GET /api/consensus/:claimId", `status ${get_c.status}`);
  }
}

// ─── 9. Corrections Endpoints ────────────────────────────────────────────────

async function testCorrections() {
  section("9. Corrections Endpoints");
  if (!token || !claimId) { warn("Corrections", "skipped — need token + claimId"); return; }

  const gen = await post("/api/corrections/generate", { claimId }, token);
  if ([200, 201].includes(gen.status)) {
    ok("POST /api/corrections/generate");
  } else {
    fail("POST /api/corrections/generate", `status ${gen.status}: ${JSON.stringify(gen.data)}`);
  }

  const corr = await get(`/api/corrections/${claimId}`, token);
  if ([200, 404].includes(corr.status)) {
    ok("GET /api/corrections/:claimId", `status ${corr.status}`);
  } else {
    fail("GET /api/corrections/:claimId", `status ${corr.status}`);
  }
}

// ─── 10. Dashboard Endpoints ─────────────────────────────────────────────────

async function testDashboard() {
  section("10. Dashboard Endpoints");
  if (!token) { warn("Dashboard", "skipped — no auth token"); return; }

  for (const path of ["/api/dashboard/top-picks", "/api/dashboard/trending", "/api/dashboard/categories", "/api/dashboard/regions", "/api/dashboard/alerts"]) {
    const r = await get(path, token);
    if (r.status === 200) ok(`GET ${path}`);
    else fail(`GET ${path}`, `status ${r.status}`);
  }
}

// ─── 11. Featured Endpoints ──────────────────────────────────────────────────

async function testFeatured() {
  section("11. Featured Endpoints");
  if (!token) { warn("Featured", "skipped — no auth token"); return; }

  const history = await get("/api/featured/history", token);
  if (history.status === 200) ok("GET /api/featured/history");
  else fail("GET /api/featured/history", `status ${history.status}`);
}

// ─── 12. i18n Endpoints ──────────────────────────────────────────────────────

async function testI18n() {
  section("12. i18n Endpoints");
  if (!token) { warn("i18n", "skipped — no auth token"); return; }

  const tr = await post("/api/i18n/translate", { text: "Hello world", targetLang: "hi" }, token);
  if (tr.status === 200) ok("POST /api/i18n/translate");
  else fail("POST /api/i18n/translate", `status ${tr.status}: ${JSON.stringify(tr.data)}`);

  const ts = await post("/api/i18n/transcribe", { audioUrl: "https://example.com/audio.mp3", targetLang: "en" }, token);
  if (ts.status === 200) ok("POST /api/i18n/transcribe");
  else fail("POST /api/i18n/transcribe", `status ${ts.status}: ${JSON.stringify(ts.data)}`);
}

// ─── 13. Auth Guard Tests ────────────────────────────────────────────────────

async function testAuthGuards() {
  section("13. Auth Guards (expect 401 without token)");

  // GET routes — no token
  const guarded_get = ["/api/auth/me", "/api/claims/history", "/api/dashboard/top-picks"];
  for (const path of guarded_get) {
    const r = await get(path);
    if (r.status === 401) ok(`${path} rejects unauthenticated`);
    else fail(`${path} auth guard`, `expected 401, got ${r.status}`);
  }

  // POST routes — no token
  const ai = await post("/api/ai/analyze-text", { text: "test" }); // no token
  if (ai.status === 401) ok("/api/ai/analyze-text rejects unauthenticated");
  else fail("/api/ai/analyze-text auth guard", `expected 401, got ${ai.status}`);
}

// ─── 14. Swagger Docs ────────────────────────────────────────────────────────

async function testSwagger() {
  section("14. Swagger / OpenAPI Docs");

  const ui = await get("/docs/");
  if (ui.status === 200) ok("GET /docs/ (Swagger UI)");
  else fail("GET /docs/", `status ${ui.status}`);

  const spec = await get("/docs.json");
  if (spec.status === 200 && spec.data?.openapi) {
    const pathCount = Object.keys(spec.data.paths ?? {}).length;
    ok("GET /docs.json (OpenAPI spec)", `${pathCount} paths defined`);
  } else {
    fail("GET /docs.json", `status ${spec.status}`);
  }
}

// ─── Main Runner ─────────────────────────────────────────────────────────────

async function main() {
  console.log(`\n${BOLD}${CYAN}╔══════════════════════════════════════════╗${RESET}`);
  console.log(`${BOLD}${CYAN}║   Clarifact API Test Suite               ║${RESET}`);
  console.log(`${BOLD}${CYAN}╚══════════════════════════════════════════╝${RESET}`);
  console.log(`  Target: ${BASE}`);
  console.log(`  Time:   ${new Date().toISOString()}\n`);

  try {
    await testHealth();
  } catch {
    console.log(`\n${RED}${BOLD}Server is not running. Start it with: npm run dev${RESET}\n`);
    process.exit(1);
  }

  await testApiKeys();
  await testAuth();
  await testClaims();
  await testAI();
  await testCommunity();
  await testExperts();
  await testConsensus();
  await testCorrections();
  await testDashboard();
  await testFeatured();
  await testI18n();
  await testAuthGuards();
  await testSwagger();

  // ── Summary ─────────────────────────────────────────────────────────────
  const total = passed + failed + warned;
  console.log(`\n${BOLD}${CYAN}━━━ Results ━━━${RESET}`);
  console.log(`  Total:   ${total}`);
  console.log(`  ${GREEN}Passed:  ${passed}${RESET}`);
  console.log(`  ${RED}Failed:  ${failed}${RESET}`);
  console.log(`  ${YELLOW}Warned:  ${warned}${RESET}\n`);

  if (failed > 0) {
    console.log(`${RED}${BOLD}❌ ${failed} test(s) failed.${RESET}\n`);
    process.exit(1);
  } else {
    console.log(`${GREEN}${BOLD}✅ All tests passed!${RESET}\n`);
  }
}

main().catch((e) => {
  console.error(RED + "Fatal error: " + RESET, e);
  process.exit(1);
});
