import type { WebSocketMessage } from "@bettin2win/types";
import { WebSocketServer, type WebSocket } from "ws";
import type { Server } from "node:http";

/** Fan-out hub: pushes every poller message to all connected browsers. */
export class Broadcaster {
  private wss: WebSocketServer;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
  }

  onConnection(handler: (socket: WebSocket) => void): void {
    this.wss.on("connection", handler);
  }

  broadcast(message: WebSocketMessage): void {
    const payload = JSON.stringify(message);
    for (const client of this.wss.clients) {
      if (client.readyState === client.OPEN) client.send(payload);
    }
  }

  get clientCount(): number {
    return this.wss.clients.size;
  }
}
