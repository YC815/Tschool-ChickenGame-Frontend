/**
 * WebSocket Manager
 * 處理 WebSocket 連線、斷線重連、事件分發
 */

import { WS_BASE_URL } from "./constants";
import type { WSMessage, WSEventType } from "./types";

type EventHandler = (data: unknown) => void;

enum ConnectionState {
  IDLE = "IDLE",
  CONNECTING = "CONNECTING",
  CONNECTED = "CONNECTED",
  RECONNECTING = "RECONNECTING",
  FAILED = "FAILED",
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private handlers: Map<WSEventType, Set<EventHandler>> = new Map();
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private readonly reconnectDelay = 2000; // ms
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private state: ConnectionState = ConnectionState.IDLE;

  constructor(private roomId: string) {}

  /**
   * 連線到 WebSocket
   */
  connect(): void {
    // 如果已經放棄重連，不再嘗試
    if (this.hasGivenUp) {
      return;
    }

    const url = `${WS_BASE_URL}/ws/${this.roomId}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      if (this.reconnectAttempts > 0) {
        console.log(`[WS] ✅ Reconnected to room ${this.roomId}`);
      }
      this.reconnectAttempts = 0;
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      // 處理心跳回應
      if (event.data === "pong") {
        return;
      }

      try {
        const message: WSMessage = JSON.parse(event.data);
        this.handleMessage(message);
      } catch (error) {
        console.error("[WS] Failed to parse message:", error);
      }
    };

    this.ws.onerror = () => {
      // WebSocket error 細節會在 onclose 事件中處理
      // 瀏覽器的 onerror 事件物件本身沒有有用訊息
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.ws = null;

      // 自動重連（靜默模式，除非真的失敗）
      if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts && !this.hasGivenUp) {
        this.reconnectAttempts++;
        setTimeout(() => this.connect(), this.reconnectDelay);
      } else if (this.reconnectAttempts >= this.maxReconnectAttempts && !this.hasGivenUp) {
        this.hasGivenUp = true;
        console.error(
          `[WS] ❌ Failed to reconnect to room ${this.roomId} after ${this.maxReconnectAttempts} attempts`,
        );
        console.error(`[WS] 🔌 WebSocket 伺服器可能沒有運行。請檢查後端是否啟動。`);
      }
    };
  }

  /**
   * 開始心跳
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send("ping");
      }
    }, 30000); // 30 秒
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * 斷線
   */
  disconnect(): void {
    this.state = ConnectionState.IDLE;
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * 註冊事件處理器
   */
  on(eventType: WSEventType, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
  }

  /**
   * 移除事件處理器
   */
  off(eventType: WSEventType, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  /**
   * 處理收到的訊息
   */
  private handleMessage(message: WSMessage): void {
    console.log(`[WS RECV] 📨 ${message.event_type}`, message.data);

    const handlers = this.handlers.get(message.event_type);
    if (handlers) {
      handlers.forEach((handler) => handler(message.data));
    }
  }

  /**
   * 檢查連線狀態
   */
  isConnected(): boolean {
    return this.state === ConnectionState.CONNECTED &&
           this.ws !== null &&
           this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * 取得目前連線狀態
   */
  getState(): ConnectionState {
    return this.state;
  }
}

/**
 * 建立 WebSocket 連線（React Hook 使用）
 */
export function createWebSocket(roomId: string): WebSocketManager {
  return new WebSocketManager(roomId);
}
