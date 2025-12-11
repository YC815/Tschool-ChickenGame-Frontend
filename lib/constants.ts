/**
 * 常數定義
 */

// ============================================
// Game Constants
// ============================================

export const TOTAL_ROUNDS = 10;

export const MESSAGE_ROUNDS = [5, 6]; // Round 5-6 可留言

export const INDICATOR_ASSIGNMENT_AFTER_ROUND = 6; // Round 6 後發放指示物

export const COOPERATION_ROUNDS = [7, 8, 9, 10]; // Round 7-10 可討論

// ============================================
// Payoff Matrix（僅供 UI 參考，真實計算在後端）
// ============================================

export const PAYOFF_MATRIX = {
  TURN_TURN: 3,
  TURN_ACCELERATE: -3,
  ACCELERATE_TURN: 10,
  ACCELERATE_ACCELERATE: -10,
} as const;

// ============================================
// UI Text
// ============================================

export const CHOICE_LABELS = {
  ACCELERATE: "加速",
  TURN: "轉彎",
} as const;

export const CHOICE_COLORS = {
  ACCELERATE: "bg-red-500 hover:bg-red-600",
  TURN: "bg-blue-500 hover:bg-blue-600",
} as const;

// ============================================
// API & WebSocket
// ============================================

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

export const WS_BASE_URL =
  process.env.NEXT_PUBLIC_WS_BASE_URL || "ws://localhost:8000/api";

// ============================================
// Local Storage Keys
// ============================================

export const STORAGE_KEYS = {
  PLAYER_CONTEXT: "chicken_game_player_context",
  HOST_CONTEXT: "chicken_game_host_context",
} as const;
