"use client";

import { useMemo } from "react";

/**
 * 管理指示物彈出視窗的顯示狀態
 */
export function useIndicatorDialog(
  roomId: string,
  playerId: string | null,
  indicatorSymbol: string | null
) {
  const hasSeenIndicator = useMemo(() => {
    if (!playerId) return false;
    const seen = localStorage.getItem(
      `indicator_seen_${roomId}_${playerId}`
    );
    return seen === "true";
  }, [roomId, playerId]);

  const showDialog = indicatorSymbol !== null && !hasSeenIndicator;

  const closeDialog = () => {
    if (!playerId) return;
    localStorage.setItem(`indicator_seen_${roomId}_${playerId}`, "true");
  };

  return { showDialog, closeDialog };
}
