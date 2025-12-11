/**
 * Utility Functions
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PlayerContext, HostContext, PayoffRecord } from "./types";
import { STORAGE_KEYS } from "./constants";

/**
 * Tailwind CSS class merger
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================
// Local Storage Helpers
// ============================================

export function savePlayerContext(context: PlayerContext): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.PLAYER_CONTEXT, JSON.stringify(context));
}

export function loadPlayerContext(): PlayerContext | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(STORAGE_KEYS.PLAYER_CONTEXT);
  return data ? JSON.parse(data) : null;
}

export function clearPlayerContext(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.PLAYER_CONTEXT);
}

export function saveHostContext(context: HostContext): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEYS.HOST_CONTEXT, JSON.stringify(context));
}

export function loadHostContext(): HostContext | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem(STORAGE_KEYS.HOST_CONTEXT);
  return data ? JSON.parse(data) : null;
}

export function clearHostContext(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEYS.HOST_CONTEXT);
}

// ============================================
// Round Helpers
// ============================================

export function getRoundPhaseDescription(
  roundNumber: number,
): string {
  if (roundNumber >= 1 && roundNumber <= 4) {
    return "基礎回合";
  }
  if (roundNumber === 5 || roundNumber === 6) {
    return "留言回合";
  }
  if (roundNumber >= 7 && roundNumber <= 10) {
    return "協作回合";
  }
  return "未知回合";
}

export function shouldShowMessagePrompt(roundNumber: number): boolean {
  return roundNumber === 5 || roundNumber === 6;
}

export function shouldShowCooperationHint(roundNumber: number): boolean {
  return roundNumber >= 7 && roundNumber <= 10;
}

// ============================================
// Payoff History Helpers
// ============================================

/**
 * 儲存單輪收益記錄
 */
export function savePayoffRecord(
  roomId: string,
  playerId: string,
  roundNumber: number,
  payoff: number,
): void {
  if (typeof window === "undefined") return;

  const key = `${STORAGE_KEYS.PAYOFF_HISTORY}_${roomId}_${playerId}`;
  const existing = loadPayoffHistory(roomId, playerId);

  // 檢查是否已存在該輪記錄（避免重複）
  const alreadyExists = existing.some((r) => r.round_number === roundNumber);
  if (alreadyExists) {
    console.warn(`[Payoff] Round ${roundNumber} already recorded, skipping`);
    return;
  }

  const newRecord: PayoffRecord = {
    round_number: roundNumber,
    payoff: payoff,
    timestamp: Date.now(),
  };

  const updated = [...existing, newRecord].sort(
    (a, b) => a.round_number - b.round_number,
  );
  localStorage.setItem(key, JSON.stringify(updated));
}

/**
 * 載入完整收益歷史
 */
export function loadPayoffHistory(
  roomId: string,
  playerId: string,
): PayoffRecord[] {
  if (typeof window === "undefined") return [];

  const key = `${STORAGE_KEYS.PAYOFF_HISTORY}_${roomId}_${playerId}`;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

/**
 * 計算累積總收益
 */
export function getTotalPayoff(roomId: string, playerId: string): number {
  const history = loadPayoffHistory(roomId, playerId);
  return history.reduce((sum, record) => sum + record.payoff, 0);
}

/**
 * 清除收益歷史
 */
export function clearPayoffHistory(roomId: string, playerId: string): void {
  if (typeof window === "undefined") return;
  const key = `${STORAGE_KEYS.PAYOFF_HISTORY}_${roomId}_${playerId}`;
  localStorage.removeItem(key);
}
