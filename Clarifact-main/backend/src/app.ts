import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";

import { notFoundHandler, errorHandler } from "./middleware/errorMiddleware";
import { apiRouter } from "./routes";
import { swaggerSpec } from "./config/swagger";

// Import swagger-docs to register JSDoc annotations (side-effect import)
import "./swagger-docs";

export function createApp() {
  const app = express();

  // Relax CSP for Swagger UI to load its assets
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
        },
      },
    })
  );
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: "20mb" }));
  app.use(express.urlencoded({ extended: true, limit: "20mb" }));
  app.use(morgan("dev"));

  // Health check
  app.get("/health", (_req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

  // Favicon (prevent 404 logs from browsers visiting the API directly)
  app.get("/favicon.ico", (_req, res) => res.status(204).end());

  // Root endpoint
  app.get("/", (_req, res) => {
    res.json({
      name: "Clarifact API",
      version: "1.0.0",
      status: "running",
      docs: "/docs",
      health: "/health",
      api: "/api"
    });
  });

  // Swagger UI at /docs
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: "Clarifact API Docs",
    customCss: `
      .swagger-ui .topbar { background-color: #1a1a2e; }
      .swagger-ui .topbar .topbar-wrapper .link { color: #e94560; }
      .swagger-ui .info .title { color: #e94560; }
    `,
  }));

  // Expose raw OpenAPI JSON
  app.get("/docs.json", (_req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  app.use("/api", apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
