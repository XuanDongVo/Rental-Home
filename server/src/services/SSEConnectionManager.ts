import { Response } from "express";

interface SSEConnection {
  userId: string;
  userType: "tenant" | "manager";
  response: Response;
  lastPing: number;
}

class SSEConnectionManager {
  private connections: Map<string, SSEConnection> = new Map();
  private pingInterval: NodeJS.Timeout;

  constructor() {
    // Ping clients every 30 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      this.pingAllClients();
    }, 100000);
  }

  addConnection(
    userId: string,
    userType: "tenant" | "manager",
    response: Response
  ): void {
    // Set SSE headers
    response.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Cache-Control",
    });

    // Send initial connection event
    this.sendEvent(response, "connected", {
      message: "SSE connection established",
    });

    // Store connection
    const connection: SSEConnection = {
      userId,
      userType,
      response,
      lastPing: Date.now(),
    };

    this.connections.set(userId, connection);

    // Handle client disconnect
    response.on("close", () => {
      this.removeConnection(userId);
    });

    console.log(`SSE connection established for ${userType}: ${userId}`);
  }

  removeConnection(userId: string): void {
    const connection = this.connections.get(userId);
    if (connection) {
      connection.response.end();
      this.connections.delete(userId);
      console.log(`SSE connection closed for user: ${userId}`);
    }
  }

  sendNotificationToUser(userId: string, notification: any): boolean {
    const connection = this.connections.get(userId);
    if (connection) {
      this.sendEvent(connection.response, "notification", notification);
      return true;
    }
    return false;
  }

  sendNotificationToAllManagers(notification: any): number {
    let count = 0;
    this.connections.forEach((connection) => {
      if (connection.userType === "manager") {
        this.sendEvent(connection.response, "notification", notification);
        count++;
      }
    });
    return count;
  }

  sendNotificationToAllTenants(notification: any): number {
    let count = 0;
    this.connections.forEach((connection) => {
      if (connection.userType === "tenant") {
        this.sendEvent(connection.response, "notification", notification);
        count++;
      }
    });
    return count;
  }

  private sendEvent(response: Response, event: string, data: any): void {
    try {
      const formattedData = `event: ${event}\ndata: ${JSON.stringify(
        data
      )}\n\n`;
      response.write(formattedData);
    } catch (error) {
      console.error("Error sending SSE event:", error);
    }
  }

  private pingAllClients(): void {
    const now = Date.now();
    const expiredConnections: string[] = [];

    this.connections.forEach((connection, userId) => {
      // Check if connection is still alive (no ping for 2 minutes = expired)
      if (now - connection.lastPing > 120000) {
        expiredConnections.push(userId);
      } else {
        // Send ping
        this.sendEvent(connection.response, "ping", { timestamp: now });
        connection.lastPing = now;
      }
    });

    // Remove expired connections
    expiredConnections.forEach((userId) => this.removeConnection(userId));
  }

  getActiveConnections(): {
    userId: string;
    userType: string;
    lastPing: number;
  }[] {
    return Array.from(this.connections.entries()).map(
      ([userId, connection]) => ({
        userId,
        userType: connection.userType,
        lastPing: connection.lastPing,
      })
    );
  }

  destroy(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    // Close all connections
    this.connections.forEach((connection) => {
      connection.response.end();
    });

    this.connections.clear();
  }
}

// Singleton instance
export const sseManager = new SSEConnectionManager();
