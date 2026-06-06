import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Clarifact API",
      version: "0.1.0",
      description:
        "AI + community misinformation verification platform. All endpoints under /api. " +
        "Authenticated endpoints require a Bearer JWT (obtain via POST /api/auth/login or /api/auth/register).",
      contact: { name: "Clarifact Team" }
    },
    servers: [
      { url: "http://localhost:4000", description: "Local development" }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT"
        }
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            error: { type: "string" },
            details: { type: "object", nullable: true }
          }
        },
        User: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["user", "validator", "expert", "admin"] }
          }
        },
        AuthResponse: {
          type: "object",
          properties: {
            user: { $ref: "#/components/schemas/User" },
            token: { type: "string", description: "JWT bearer token" }
          }
        },
        Claim: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            title: { type: "string" },
            status: { type: "string" },
            createdAt: { type: "string", format: "date-time" }
          }
        },
        ProviderResult: {
          type: "object",
          properties: {
            meta: {
              type: "object",
              properties: {
                provider: { type: "string" },
                model: { type: "string" },
                latencyMs: { type: "number" },
                usedMock: { type: "boolean" }
              }
            },
            json: { type: "object" },
            rawText: { type: "string", nullable: true }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ["./src/routes/*.ts", "./src/swagger-docs.ts"]
};

export const swaggerSpec = swaggerJsdoc(options);
