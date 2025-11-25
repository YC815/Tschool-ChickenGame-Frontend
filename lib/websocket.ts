/**
 * WebSocket Manager
 * 處理 WebSocket 連線、斷線重連、事件分發
 */

import { WS_BASE_URL } from "./constants";
import type { WSMessage, WSEventType } from "./types";

type EventHandler = (data: unknown) => void;

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private handlers: Map<WSEventType, Set<EventHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 2000; // ms
  private shouldReconnect = true;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  constructor(private roomId: string) {}

  /**
   * 連線到 WebSocket
   */
  connect(): void {
    const url = `${WS_BASE_URL}/ws/${this.roomId}`;

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log("[WS] Connected");
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

    this.ws.onerror = (error) => {
      console.error("[WS] Error:", error);
    };

    this.ws.onclose = () => {
      console.log("[WS] Disconnected");
      this.stopHeartbeat();
      this.ws = null;

      // 自動重連
      if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(
          `[WS] Reconnecting... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`,
        );
        setTimeout(() => this.connect(), this.reconnectDelay);
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
    this.shouldReconnect = false;
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
    console.log("[WS] Received:", message.event_type, message.data);

    const handlers = this.handlers.get(message.event_type);
    if (handlers) {
      handlers.forEach((handler) => handler(message.data));
    }
  }

  /**
   * 檢查連線狀態
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }
}

/**
 * 建立 WebSocket 連線（React Hook 使用）
 */
export function createWebSocket(roomId: string): WebSocketManager {
  return new WebSocketManager(roomId);
}
