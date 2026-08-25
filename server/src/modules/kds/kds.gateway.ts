import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";
import { config } from "../../config/index.js";

let ioInstance: SocketIOServer | null = null;
let gatewayInstance: KDSGateway | null = null;

export class KDSGateway {
  private io: SocketIOServer;

  constructor(server: HttpServer) {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: config.corsOrigins,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });

    this.initializeEvents();
    ioInstance = this.io;
    gatewayInstance = this;
  }

  private initializeEvents() {
    this.io.on("connection", (socket: Socket) => {
      console.log(`[WebSocket] Client connected: ${socket.id}`);

      // Client joins store-specific room
      socket.on("join_store", (data: { storeId: string; clientType?: "POS" | "KDS" | "CFD" }) => {
        const storeId = data.storeId || "store-001";
        const roomName = `store:${storeId}`;
        const kdsRoomName = `store:${storeId}:kds`;
        socket.join(roomName);

        if (data.clientType === "KDS") {
          socket.join(kdsRoomName);
          console.log(`[WebSocket] KDS Terminal joined room: ${kdsRoomName}`);
        } else {
          console.log(`[WebSocket] Client ${socket.id} (${data.clientType || "POS"}) joined ${roomName}`);
        }

        socket.emit("store_joined", {
          storeId,
          room: roomName,
          timestamp: new Date().toISOString(),
        });
      });

      // Barista item bump event
      socket.on("kds:bump_item", (data: { storeId: string; orderId: string; itemId: string }) => {
        const roomName = `store:${data.storeId || "store-001"}`;
        this.io.to(roomName).emit("order:item_bumped", {
          orderId: data.orderId,
          itemId: data.itemId,
          timestamp: new Date().toISOString(),
        });
      });

      // Barista status update event
      socket.on("kds:update_status", (data: { storeId: string; orderId: string; status: string }) => {
        const roomName = `store:${data.storeId || "store-001"}`;
        this.io.to(roomName).emit("order:status_update", {
          orderId: data.orderId,
          status: data.status,
          timestamp: new Date().toISOString(),
        });
      });

      socket.on("disconnect", () => {
        console.log(`[WebSocket] Client disconnected: ${socket.id}`);
      });
    });
  }

  public broadcastOrderCreated(storeId: string, payload: any) {
    const roomName = `store:${storeId}`;
    console.log(`[WebSocket] Broadcasting order:created to ${roomName} (Ticket #${payload.order?.ticketNumber})`);
    this.io.to(roomName).emit("order:created", payload);
  }

  public broadcastOrderStatusUpdate(storeId: string, payload: any) {
    const roomName = `store:${storeId}`;
    console.log(`[WebSocket] Broadcasting order:status_update to ${roomName} (Status: ${payload.status})`);
    this.io.to(roomName).emit("order:status_update", payload);
  }

  public broadcastLowStockAlert(storeId: string, alert: any) {
    const roomName = `store:${storeId}`;
    this.io.to(roomName).emit("inventory:low_stock", alert);
  }

  public broadcastShiftClosed(storeId: string, shift: any) {
    const roomName = `store:${storeId}`;
    this.io.to(roomName).emit("shift:closed", shift);
  }
}

export function initSocketGateway(server: HttpServer): KDSGateway {
  return new KDSGateway(server);
}

export function getSocketGateway(): KDSGateway | null {
  return gatewayInstance;
}
