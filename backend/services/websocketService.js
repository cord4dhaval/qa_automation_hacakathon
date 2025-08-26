const WebSocket = require("ws");

class WebSocketService {
  constructor() {
    this.wss = null;
    this.clients = new Map(); // Map taskId to Set of websocket connections
  }

  initialize(server) {
    this.wss = new WebSocket.Server({ server });

    this.wss.on("connection", (ws, req) => {
      console.log("🔗 New WebSocket connection established");

      ws.on("message", (message) => {
        try {
          const data = JSON.parse(message);
          this.handleMessage(ws, data);
        } catch (error) {
          console.error("❌ Invalid WebSocket message:", error);
          ws.send(
            JSON.stringify({
              type: "error",
              message: "Invalid message format",
            })
          );
        }
      });

      ws.on("close", () => {
        console.log("🔌 WebSocket connection closed");
        this.removeClient(ws);
      });

      ws.on("error", (error) => {
        console.error("❌ WebSocket error:", error);
        this.removeClient(ws);
      });
    });

    console.log("✅ WebSocket service initialized");
  }

  handleMessage(ws, data) {
    switch (data.type) {
      case "subscribe":
        if (data.taskId) {
          this.subscribeToTask(ws, data.taskId);
        }
        break;
      case "unsubscribe":
        if (data.taskId) {
          this.unsubscribeFromTask(ws, data.taskId);
        }
        break;
      case "ping":
        ws.send(JSON.stringify({ type: "pong" }));
        break;
      default:
        ws.send(
          JSON.stringify({
            type: "error",
            message: "Unknown message type",
          })
        );
    }
  }

  subscribeToTask(ws, taskId) {
    if (!this.clients.has(taskId)) {
      this.clients.set(taskId, new Set());
    }

    this.clients.get(taskId).add(ws);
    ws.taskId = taskId;

    ws.send(
      JSON.stringify({
        type: "subscribed",
        taskId,
        message: `Subscribed to task ${taskId}`,
      })
    );

    console.log(`📡 Client subscribed to task: ${taskId}`);
  }

  unsubscribeFromTask(ws, taskId) {
    if (this.clients.has(taskId)) {
      this.clients.get(taskId).delete(ws);

      // Clean up empty sets
      if (this.clients.get(taskId).size === 0) {
        this.clients.delete(taskId);
      }
    }

    delete ws.taskId;

    ws.send(
      JSON.stringify({
        type: "unsubscribed",
        taskId,
        message: `Unsubscribed from task ${taskId}`,
      })
    );

    console.log(`📡 Client unsubscribed from task: ${taskId}`);
  }

  removeClient(ws) {
    if (ws.taskId && this.clients.has(ws.taskId)) {
      this.clients.get(ws.taskId).delete(ws);

      // Clean up empty sets
      if (this.clients.get(ws.taskId).size === 0) {
        this.clients.delete(ws.taskId);
      }
    }
  }

  // Broadcast automation progress to all subscribed clients
  broadcastAutomationProgress(taskId, progressData) {
    if (this.clients.has(taskId)) {
      const message = JSON.stringify({
        type: "automation_progress",
        taskId,
        timestamp: new Date().toISOString(),
        ...progressData,
      });

      this.clients.get(taskId).forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(message);
          } catch (error) {
            console.error("❌ Failed to send message to client:", error);
            this.clients.get(taskId).delete(client);
          }
        }
      });
    }
  }

  // Broadcast step start
  broadcastStepStart(taskId, stepData) {
    this.broadcastAutomationProgress(taskId, {
      type: "step_start",
      ...stepData,
    });
  }

  // Broadcast step completion
  broadcastStepComplete(taskId, stepResult) {
    this.broadcastAutomationProgress(taskId, {
      type: "step_complete",
      ...stepResult,
    });
  }

  // Broadcast automation completion
  broadcastAutomationComplete(taskId, results) {
    this.broadcastAutomationProgress(taskId, {
      type: "automation_complete",
      results,
    });
  }

  // Broadcast automation failure
  broadcastAutomationError(taskId, error) {
    this.broadcastAutomationProgress(taskId, {
      type: "automation_error",
      error: error.message,
    });
  }

  // Get connection count for a task
  getTaskConnectionCount(taskId) {
    return this.clients.has(taskId) ? this.clients.get(taskId).size : 0;
  }

  // Get all active task IDs
  getActiveTasks() {
    return Array.from(this.clients.keys());
  }

  // Get total connection count
  getTotalConnections() {
    let total = 0;
    this.clients.forEach((clientSet) => {
      total += clientSet.size;
    });
    return total;
  }
}

module.exports = new WebSocketService(); // Export singleton instance
