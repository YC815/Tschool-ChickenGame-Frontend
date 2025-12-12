"use client";

import { useEffect, useState } from "react";

/**
 * 管理指示物彈出視窗的顯示狀態
 */
export function useIndicatorDialog(
  roomId: string,
  playerId: string | null,
  indicatorSymbol: string | null
) {
  const [hasSeenIndicator, setHasSeenIndicator] = useState(() => {
    if (!playerId) return false;
    return (
      typeof localStorage === "object" &&
      localStorage.getItem(`indicator_seen_${roomId}_${playerId}`) === "true"
    );
  });

  useEffect(() => {
    if (!playerId) {
      setHasSeenIndicator(false);
      return;
    }

    const seen = localStorage.getItem(
      `indicator_seen_${roomId}_${playerId}`
    );
    setHasSeenIndicator(seen === "true");
  }, [roomId, playerId]);

  const showDialog = indicatorSymbol !== null && !hasSeenIndicator;

  const closeDialog = () => {
    if (!playerId) return;
    localStorage.setItem(`indicator_seen_${roomId}_${playerId}`, "true");
    setHasSeenIndicator(true);
  };

  return { showDialog, closeDialog };
}
