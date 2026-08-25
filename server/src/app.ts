import express from "express";
import cors from "cors";
import { config } from "./config/index.js";
import { tenantContext } from "./middleware/tenant.middleware.js";
import { errorHandler } from "./middleware/error.middleware.js";
import apiRoutes from "./routes/index.js";

export function createApp() {
  const app = express();

  // Basic Middlewares
  app.use(
    cors({
      origin: "*",
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "x-store-id", "x-tenant-slug", "x-staff-role", "x-signature"],
    })
  );
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Tenant Resolution Middleware
  app.use(tenantContext);

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      service: "cafe-pos-server",
    });
  });

  // Mount API v1 Routes
  app.use("/api/v1", apiRoutes);

  // Global Error Handler
  app.use(errorHandler);

  return app;
}
