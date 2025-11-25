/**
 * Utility Functions
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { PlayerContext, HostContext } from "./types";
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
