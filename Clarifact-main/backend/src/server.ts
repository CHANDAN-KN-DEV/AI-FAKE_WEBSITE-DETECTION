import { env } from "./config/env";
import { createApp } from "./app";

// Global guard: prevent uncaught BullMQ/ioredis errors from killing the process
process.on("uncaughtException", (err: Error) => {
  if (err.message?.includes("Connection is closed") || err.message?.includes("ECONNREFUSED")) {
    console.warn("[Process] Suppressed connection error:", err.message);
  } else {
    console.error("[Process] Uncaught exception:", err);
  }
});

process.on("unhandledRejection", (reason: unknown) => {
  const msg = reason instanceof Error ? reason.message : String(reason);
  if (msg?.includes("Connection is closed") || msg?.includes("ECONNREFUSED")) {
    console.warn("[Process] Suppressed unhandled rejection:", msg);
  } else {
    console.error("[Process] Unhandled rejection:", reason);
  }
});

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`Clarifact backend listening on :${env.PORT}`);
  console.log(`  → API docs: http://localhost:${env.PORT}/docs`);
  console.log(`  → Health:   http://localhost:${env.PORT}/health`);
});

// Start background worker lazily — queue is a bonus, not critical
setTimeout(async () => {
  try {
    const { initFeaturedTrackerQueue } = await import("./jobs/featuredTracker");
    const result = initFeaturedTrackerQueue();
    if (result) console.log("[Queue] Featured tracker queue started.");
    else console.warn("[Queue] Featured tracker skipped (Redis unavailable).");
  } catch (e) {
    console.warn("[Queue] Featured tracker not started:", (e as Error).message);
  }
}, 2000);
