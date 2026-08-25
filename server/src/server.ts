import http from "http";
import { createApp } from "./app.js";
import { config } from "./config/index.js";
import { initSocketGateway } from "./modules/kds/kds.gateway.js";

async function bootstrap() {
  const app = createApp();
  const server = http.createServer(app);

  // Initialize Real-time Socket.io KDS Gateway
  const kdsGateway = initSocketGateway(server);

  server.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(`☕ Café POS SaaS Backend & KDS Gateway running!`);
    console.log(`🚀 HTTP API:       http://localhost:${config.port}/api/v1`);
    console.log(`⚡ WebSocket KDS:  ws://localhost:${config.port}`);
    console.log(`🏥 Health Check:   http://localhost:${config.port}/health`);
    console.log(`=======================================================`);
  });

  // Graceful Shutdown
  const shutdown = () => {
    console.log("\nShutting down Café POS server gracefully...");
    server.close(() => {
      console.log("Server closed.");
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((err) => {
  console.error("Fatal Error starting server:", err);
  process.exit(1);
});
